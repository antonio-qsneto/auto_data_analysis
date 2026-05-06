from __future__ import annotations

import os
from pathlib import Path
from typing import Any

from aws_cdk import (
    CfnOutput,
    Duration,
    Fn,
    RemovalPolicy,
    SecretValue,
    Stack,
    aws_amplify as amplify,
    aws_cloudfront as cloudfront,
    aws_cloudfront_origins as origins,
    aws_cognito as cognito,
    aws_ec2 as ec2,
    aws_ecr_assets as ecr_assets,
    aws_ecs as ecs,
    aws_elasticache as elasticache,
    aws_elasticloadbalancingv2 as elbv2,
    aws_iam as iam,
    aws_logs as logs,
    aws_rds as rds,
    aws_s3 as s3,
    aws_secretsmanager as secretsmanager,
)
from constructs import Construct


class AutoDataAnalysisStack(Stack):
    def __init__(self, scope: Construct, construct_id: str, **kwargs: Any) -> None:
        super().__init__(scope, construct_id, **kwargs)

        project_name = self._ctx_str("project_name", "auto-data-analysis")
        app_env = self._app_env()
        is_prod = app_env == "prod"
        environment_name = os.getenv("APP_ENV") or self._ctx_str("environment_name", app_env)
        name_prefix = f"{project_name}-{environment_name}"

        health_check_path = self._ctx_str("health_check_path", "/api/health/")

        fargate_cpu = self._ctx_int("fargate_cpu", 512)
        fargate_memory_mib = self._ctx_int("fargate_memory_mib", 1024)
        web_desired_count = self._ctx_int("web_desired_count", 1)
        worker_desired_count = self._ctx_int("worker_desired_count", 1)
        enable_celery_beat = self._ctx_bool("enable_celery_beat", False)
        nat_gateways = self._ctx_int("nat_gateways", 1)

        django_debug = self._ctx_prod_bool("django_debug", dev_default=False, prod_default=False, is_prod=is_prod)
        django_allowed_hosts = self._ctx_str("django_allowed_hosts", "*")
        auth_mode = self._ctx_prod_str("auth_mode", "cognito", "cognito", is_prod)
        secure_ssl_redirect = self._ctx_prod_str("secure_ssl_redirect", "True", "False", is_prod)

        existing_amplify_app_id = self._ctx_str("existing_amplify_app_id", "")
        existing_amplify_default_domain = self._ctx_str("existing_amplify_default_domain", "")
        amplify_branch_name = self._ctx_str("amplify_branch_name", app_env if is_prod else environment_name)
        if existing_amplify_app_id:
            amplify_app_id = existing_amplify_app_id
            amplify_default_domain = (
                existing_amplify_default_domain
                or f"{existing_amplify_app_id}.amplifyapp.com"
            )
        else:
            amplify_app_name = self._ctx_str("amplify_app_name", f"{name_prefix}-frontend")
            amplify_app = amplify.CfnApp(
                self,
                "FrontendAmplifyApp",
                name=amplify_app_name,
                platform="WEB",
            )
            amplify_branch = amplify.CfnBranch(
                self,
                "FrontendAmplifyBranch",
                app_id=amplify_app.attr_app_id,
                branch_name=amplify_branch_name,
                enable_auto_build=False,
                stage="PRODUCTION" if is_prod else "DEVELOPMENT",
            )
            amplify_branch.add_dependency(amplify_app)
            amplify_app_id = amplify_app.attr_app_id
            amplify_default_domain = amplify_app.attr_default_domain

        amplify_frontend_url = Fn.join(
            "",
            ["https://", amplify_branch_name, ".", amplify_default_domain],
        )
        frontend_url = self._ctx_prod_str(
            "frontend_url",
            "http://localhost:5173",
            amplify_frontend_url,
            is_prod,
        )
        cors_allowed_origins = self._ctx_prod_str(
            "cors_allowed_origins",
            "http://localhost:5173",
            frontend_url,
            is_prod,
        )

        cognito_domain_prefix = self._ctx_prod_str(
            "cognito_domain_prefix",
            "auto-data-analysis-dev-auth",
            f"{project_name}-{environment_name}-auth",
            is_prod,
        ).lower()
        cognito_callback_urls = self._ctx_list(
            "cognito_callback_urls",
            Fn.join("", [frontend_url, "/auth/callback"]),
            dev_default="http://localhost:5173/auth/callback",
            prod_default=Fn.join("", [frontend_url, "/auth/callback"]),
            is_prod=is_prod,
        )
        cognito_logout_urls = self._ctx_list(
            "cognito_logout_urls",
            Fn.join("", [frontend_url, "/login"]),
            dev_default="http://localhost:5173/login",
            prod_default=Fn.join("", [frontend_url, "/login"]),
            is_prod=is_prod,
        )
        cognito_google_client_id = self._ctx_str("cognito_google_client_id", "")
        cognito_google_client_secret_arn = self._ctx_str("cognito_google_client_secret_arn", "")
        cognito_google_client_secret_json_field = self._ctx_str(
            "cognito_google_client_secret_json_field",
            "",
        )

        db_name = self._ctx_str("db_name", "auto_data_analysis")
        db_username = self._ctx_str("db_username", "app_user")
        db_allocated_storage = self._ctx_int("db_allocated_storage", 20)
        db_max_allocated_storage = self._ctx_int("db_max_allocated_storage", 100)
        db_multi_az = self._ctx_prod_bool("db_multi_az", False, False, is_prod)
        db_deletion_protection = self._ctx_prod_bool("db_deletion_protection", False, True, is_prod)

        redis_node_type = self._ctx_str("redis_node_type", "cache.t3.micro")
        redis_engine_version = self._ctx_str("redis_engine_version", "7.1")
        redis_db = self._ctx_int("redis_db", 0)

        app_secret_arn = self._ctx_str("app_secret_arn", "")
        existing_s3_bucket_name = self._ctx_str("existing_s3_bucket_name", "")
        create_s3_bucket = self._ctx_prod_bool("create_s3_bucket", False, True, is_prod)

        backend_dir = Path(__file__).resolve().parents[2] / "backend"
        backend_image = ecr_assets.DockerImageAsset(
            self,
            "BackendDockerImage",
            directory=str(backend_dir),
            file="Dockerfile",
        )

        vpc = ec2.Vpc(
            self,
            "Vpc",
            max_azs=2,
            nat_gateways=nat_gateways,
            subnet_configuration=[
                ec2.SubnetConfiguration(
                    name="public",
                    subnet_type=ec2.SubnetType.PUBLIC,
                    cidr_mask=24,
                ),
                ec2.SubnetConfiguration(
                    name="private-egress",
                    subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS,
                    cidr_mask=24,
                ),
                ec2.SubnetConfiguration(
                    name="private-isolated",
                    subnet_type=ec2.SubnetType.PRIVATE_ISOLATED,
                    cidr_mask=24,
                ),
            ],
        )

        alb_sg = ec2.SecurityGroup(
            self,
            "AlbSecurityGroup",
            vpc=vpc,
            allow_all_outbound=True,
            description="Security group for public ALB",
        )
        alb_sg.add_ingress_rule(ec2.Peer.any_ipv4(), ec2.Port.tcp(80), "Allow HTTP traffic")

        app_sg = ec2.SecurityGroup(
            self,
            "AppSecurityGroup",
            vpc=vpc,
            allow_all_outbound=True,
            description="Security group for ECS services",
        )
        app_sg.add_ingress_rule(alb_sg, ec2.Port.tcp(8000), "Allow ALB to access Django")

        db_sg = ec2.SecurityGroup(
            self,
            "DbSecurityGroup",
            vpc=vpc,
            allow_all_outbound=True,
            description="Security group for PostgreSQL",
        )
        db_sg.add_ingress_rule(app_sg, ec2.Port.tcp(5432), "Allow ECS services to access PostgreSQL")

        redis_sg = ec2.SecurityGroup(
            self,
            "RedisSecurityGroup",
            vpc=vpc,
            allow_all_outbound=True,
            description="Security group for Redis",
        )
        redis_sg.add_ingress_rule(app_sg, ec2.Port.tcp(6379), "Allow ECS services to access Redis")

        rds_instance = rds.DatabaseInstance(
            self,
            "PostgresInstance",
            engine=rds.DatabaseInstanceEngine.postgres(version=rds.PostgresEngineVersion.VER_16_10),
            vpc=vpc,
            vpc_subnets=ec2.SubnetSelection(subnet_type=ec2.SubnetType.PRIVATE_ISOLATED),
            security_groups=[db_sg],
            credentials=rds.Credentials.from_generated_secret(db_username),
            database_name=db_name,
            instance_type=ec2.InstanceType.of(ec2.InstanceClass.BURSTABLE3, ec2.InstanceSize.MICRO),
            allocated_storage=db_allocated_storage,
            max_allocated_storage=db_max_allocated_storage,
            multi_az=db_multi_az,
            publicly_accessible=False,
            backup_retention=Duration.days(7),
            deletion_protection=db_deletion_protection,
            removal_policy=RemovalPolicy.SNAPSHOT if db_deletion_protection else RemovalPolicy.DESTROY,
        )

        redis_subnet_group = elasticache.CfnSubnetGroup(
            self,
            "RedisSubnetGroup",
            description="Subnet group for Redis",
            subnet_ids=[
                subnet.subnet_id
                for subnet in vpc.select_subnets(subnet_type=ec2.SubnetType.PRIVATE_ISOLATED).subnets
            ],
            cache_subnet_group_name=f"{name_prefix}-redis-subnet-group",
        )

        redis_cluster = elasticache.CfnCacheCluster(
            self,
            "RedisCluster",
            cluster_name=f"{name_prefix}-redis",
            engine="redis",
            engine_version=redis_engine_version,
            cache_node_type=redis_node_type,
            num_cache_nodes=1,
            cache_subnet_group_name=redis_subnet_group.ref,
            vpc_security_group_ids=[redis_sg.security_group_id],
            port=6379,
            auto_minor_version_upgrade=True,
        )
        redis_cluster.add_dependency(redis_subnet_group)

        redis_url = Fn.join(
            "",
            [
                "redis://",
                redis_cluster.attr_redis_endpoint_address,
                ":",
                redis_cluster.attr_redis_endpoint_port,
                f"/{redis_db}",
            ],
        )

        user_pool = cognito.UserPool(
            self,
            "CognitoUserPool",
            user_pool_name=f"{name_prefix}-users",
            self_sign_up_enabled=True,
            sign_in_aliases=cognito.SignInAliases(email=True),
            sign_in_case_sensitive=False,
            auto_verify=cognito.AutoVerifiedAttrs(email=True),
            account_recovery=cognito.AccountRecovery.EMAIL_ONLY,
            standard_attributes=cognito.StandardAttributes(
                email=cognito.StandardAttribute(required=True, mutable=True),
            ),
            password_policy=cognito.PasswordPolicy(
                min_length=8,
                require_digits=True,
                require_lowercase=True,
                require_symbols=False,
                require_uppercase=True,
            ),
            removal_policy=RemovalPolicy.RETAIN,
        )

        user_pool_domain = user_pool.add_domain(
            "CognitoUserPoolDomain",
            cognito_domain=cognito.CognitoDomainOptions(domain_prefix=cognito_domain_prefix),
        )

        supported_identity_providers = [cognito.UserPoolClientIdentityProvider.COGNITO]
        google_provider = None
        if cognito_google_client_id and cognito_google_client_secret_arn:
            if cognito_google_client_secret_json_field:
                google_client_secret = SecretValue.secrets_manager(
                    cognito_google_client_secret_arn,
                    json_field=cognito_google_client_secret_json_field,
                )
            else:
                google_client_secret = SecretValue.secrets_manager(
                    cognito_google_client_secret_arn,
                )
            google_provider = cognito.UserPoolIdentityProviderGoogle(
                self,
                "CognitoGoogleIdentityProvider",
                user_pool=user_pool,
                client_id=cognito_google_client_id,
                client_secret_value=google_client_secret,
                scopes=["openid", "email", "profile"],
            )
            supported_identity_providers.append(cognito.UserPoolClientIdentityProvider.GOOGLE)

        user_pool_client = user_pool.add_client(
            "CognitoUserPoolClient",
            user_pool_client_name=f"{name_prefix}-web",
            generate_secret=False,
            prevent_user_existence_errors=True,
            auth_flows=cognito.AuthFlow(user_srp=True),
            access_token_validity=Duration.minutes(60),
            id_token_validity=Duration.minutes(60),
            refresh_token_validity=Duration.days(30),
            supported_identity_providers=supported_identity_providers,
            o_auth=cognito.OAuthSettings(
                flows=cognito.OAuthFlows(authorization_code_grant=True),
                scopes=[
                    cognito.OAuthScope.OPENID,
                    cognito.OAuthScope.EMAIL,
                    cognito.OAuthScope.PROFILE,
                    cognito.OAuthScope.COGNITO_ADMIN,
                ],
                callback_urls=cognito_callback_urls,
                logout_urls=cognito_logout_urls,
            ),
        )
        if google_provider:
            user_pool_client.node.add_dependency(google_provider)

        cognito_issuer = Fn.join(
            "",
            [
                "https://cognito-idp.",
                self.region,
                ".amazonaws.com/",
                user_pool.user_pool_id,
            ],
        )

        app_env_secret = None
        if app_secret_arn:
            app_env_secret = secretsmanager.Secret.from_secret_complete_arn(
                self,
                "AppEnvSecret",
                app_secret_arn,
            )

        reports_bucket = None
        if create_s3_bucket:
            reports_bucket = s3.Bucket(
                self,
                "ReportsBucket",
                bucket_name=f"{name_prefix}-reports-{self.account}",
                block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
                encryption=s3.BucketEncryption.S3_MANAGED,
                versioned=True,
                removal_policy=RemovalPolicy.RETAIN,
            )
        elif existing_s3_bucket_name:
            reports_bucket = s3.Bucket.from_bucket_name(
                self,
                "ReportsBucket",
                bucket_name=existing_s3_bucket_name,
            )

        cluster = ecs.Cluster(
            self,
            "EcsCluster",
            vpc=vpc,
            cluster_name=f"{name_prefix}-cluster",
            container_insights_v2=ecs.ContainerInsights.ENABLED,
            enable_fargate_capacity_providers=True,
        )

        web_logs = logs.LogGroup(
            self,
            "WebLogGroup",
            log_group_name=f"/ecs/{name_prefix}/web",
            retention=logs.RetentionDays.ONE_MONTH,
            removal_policy=RemovalPolicy.DESTROY,
        )
        worker_logs = logs.LogGroup(
            self,
            "WorkerLogGroup",
            log_group_name=f"/ecs/{name_prefix}/worker",
            retention=logs.RetentionDays.ONE_MONTH,
            removal_policy=RemovalPolicy.DESTROY,
        )

        common_env = {
            "APP_ENV": app_env,
            "AUTH_MODE": auth_mode,
            "DJANGO_DEBUG": str(django_debug),
            "DJANGO_ALLOWED_HOSTS": django_allowed_hosts,
            "CORS_ALLOWED_ORIGINS": cors_allowed_origins,
            "FRONTEND_URL": frontend_url,
            "SECURE_SSL_REDIRECT": secure_ssl_redirect,
            "POSTGRES_HOST": rds_instance.db_instance_endpoint_address,
            "POSTGRES_PORT": rds_instance.db_instance_endpoint_port,
            "POSTGRES_DB": db_name,
            "POSTGRES_USER": db_username,
            "REDIS_HOST": redis_cluster.attr_redis_endpoint_address,
            "REDIS_PORT": redis_cluster.attr_redis_endpoint_port,
            "REDIS_DB": str(redis_db),
            "REDIS_URL": redis_url,
            "AWS_S3_REGION_NAME": self.region,
            "COGNITO_REGION": self.region,
            "COGNITO_USER_POOL_ID": user_pool.user_pool_id,
            "COGNITO_APP_CLIENT_ID": user_pool_client.user_pool_client_id,
            "COGNITO_ISSUER": cognito_issuer,
        }

        if reports_bucket:
            common_env["AWS_STORAGE_BUCKET_NAME"] = reports_bucket.bucket_name

        common_secrets: dict[str, ecs.Secret] = {}
        if rds_instance.secret:
            common_secrets["POSTGRES_PASSWORD"] = ecs.Secret.from_secrets_manager(
                rds_instance.secret, "password"
            )

        if app_env_secret:
            app_secret_fields = [
                "DJANGO_SECRET_KEY",
                "OPENAI_API_KEY",
                "GOOGLE_API_KEY",
                "OPENROUTER_API_KEY",
                "EMAIL_HOST_USER",
                "EMAIL_HOST_PASSWORD",
                "DEFAULT_FROM_EMAIL",
            ]
            for field in app_secret_fields:
                common_secrets[field] = ecs.Secret.from_secrets_manager(app_env_secret, field)

        web_task = ecs.FargateTaskDefinition(
            self,
            "WebTaskDefinition",
            cpu=fargate_cpu,
            memory_limit_mib=fargate_memory_mib,
        )

        web_container = web_task.add_container(
            "backend-web",
            image=ecs.ContainerImage.from_docker_image_asset(backend_image),
            command=["web"],
            environment={
                **common_env,
                "MIGRATE_ON_START": "true",
                "COLLECTSTATIC_ON_START": "true",
            },
            secrets=common_secrets,
            logging=ecs.LogDrivers.aws_logs(stream_prefix="backend-web", log_group=web_logs),
            essential=True,
        )
        web_container.add_port_mappings(ecs.PortMapping(container_port=8000))

        web_service = ecs.FargateService(
            self,
            "WebService",
            cluster=cluster,
            task_definition=web_task,
            desired_count=web_desired_count,
            assign_public_ip=False,
            security_groups=[app_sg],
            enable_execute_command=True,
            vpc_subnets=ec2.SubnetSelection(subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS),
        )

        alb = elbv2.ApplicationLoadBalancer(
            self,
            "BackendAlb",
            vpc=vpc,
            internet_facing=True,
            security_group=alb_sg,
            load_balancer_name=f"{name_prefix}-alb",
        )
        listener = alb.add_listener("HttpListener", port=80, open=True)
        listener.add_targets(
            "WebTargets",
            port=8000,
            protocol=elbv2.ApplicationProtocol.HTTP,
            targets=[
                web_service.load_balancer_target(
                    container_name=web_container.container_name,
                    container_port=8000,
                )
            ],
            health_check=elbv2.HealthCheck(
                enabled=True,
                path=health_check_path,
                healthy_http_codes="200",
                interval=Duration.seconds(30),
                timeout=Duration.seconds(5),
                healthy_threshold_count=2,
                unhealthy_threshold_count=5,
            ),
        )

        api_distribution = cloudfront.Distribution(
            self,
            "ApiDistribution",
            default_behavior=cloudfront.BehaviorOptions(
                origin=origins.LoadBalancerV2Origin(
                    alb,
                    protocol_policy=cloudfront.OriginProtocolPolicy.HTTP_ONLY,
                ),
                allowed_methods=cloudfront.AllowedMethods.ALLOW_ALL,
                cached_methods=cloudfront.CachedMethods.CACHE_GET_HEAD_OPTIONS,
                cache_policy=cloudfront.CachePolicy.CACHING_DISABLED,
                origin_request_policy=cloudfront.OriginRequestPolicy.ALL_VIEWER_EXCEPT_HOST_HEADER,
                viewer_protocol_policy=cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
            ),
            comment=f"{name_prefix} API HTTPS distribution",
        )

        web_scaling = web_service.auto_scale_task_count(min_capacity=1, max_capacity=4)
        web_scaling.scale_on_cpu_utilization(
            "WebCpuScaling",
            target_utilization_percent=70,
            scale_in_cooldown=Duration.seconds(60),
            scale_out_cooldown=Duration.seconds(60),
        )

        worker_task = ecs.FargateTaskDefinition(
            self,
            "WorkerTaskDefinition",
            cpu=fargate_cpu,
            memory_limit_mib=fargate_memory_mib,
        )
        worker_container = worker_task.add_container(
            "backend-worker",
            image=ecs.ContainerImage.from_docker_image_asset(backend_image),
            command=["worker"],
            environment={
                **common_env,
                "MIGRATE_ON_START": "false",
                "COLLECTSTATIC_ON_START": "false",
            },
            secrets=common_secrets,
            logging=ecs.LogDrivers.aws_logs(stream_prefix="backend-worker", log_group=worker_logs),
            essential=True,
        )

        worker_service = ecs.FargateService(
            self,
            "WorkerService",
            cluster=cluster,
            task_definition=worker_task,
            desired_count=worker_desired_count,
            assign_public_ip=False,
            security_groups=[app_sg],
            enable_execute_command=True,
            vpc_subnets=ec2.SubnetSelection(subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS),
        )
        worker_service.node.add_dependency(redis_cluster)
        worker_service.node.add_dependency(rds_instance)

        if enable_celery_beat:
            beat_task = ecs.FargateTaskDefinition(
                self,
                "BeatTaskDefinition",
                cpu=256,
                memory_limit_mib=512,
            )
            beat_task.add_container(
                "backend-beat",
                image=ecs.ContainerImage.from_docker_image_asset(backend_image),
                command=["beat"],
                environment={
                    **common_env,
                    "MIGRATE_ON_START": "false",
                    "COLLECTSTATIC_ON_START": "false",
                },
                secrets=common_secrets,
                logging=ecs.LogDrivers.aws_logs(stream_prefix="backend-beat", log_group=worker_logs),
                essential=True,
            )
            beat_service = ecs.FargateService(
                self,
                "BeatService",
                cluster=cluster,
                task_definition=beat_task,
                desired_count=1,
                assign_public_ip=False,
                security_groups=[app_sg],
                enable_execute_command=True,
                vpc_subnets=ec2.SubnetSelection(subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS),
            )
            beat_service.node.add_dependency(redis_cluster)
            beat_service.node.add_dependency(rds_instance)

        if reports_bucket:
            reports_bucket.grant_read_write(web_task.task_role)
            reports_bucket.grant_read_write(worker_task.task_role)

        web_task.task_role.add_to_principal_policy(
            iam.PolicyStatement(
                actions=["cognito-idp:AdminDeleteUser"],
                resources=[user_pool.user_pool_arn],
            )
        )

        if app_env_secret:
            app_env_secret.grant_read(web_task.task_role)
            app_env_secret.grant_read(worker_task.task_role)

        if rds_instance.secret:
            rds_instance.secret.grant_read(web_task.task_role)
            rds_instance.secret.grant_read(worker_task.task_role)

        CfnOutput(self, "VpcId", value=vpc.vpc_id)
        CfnOutput(self, "AlbDnsName", value=alb.load_balancer_dns_name)
        CfnOutput(self, "ApiDistributionDomainName", value=api_distribution.distribution_domain_name)
        CfnOutput(
            self,
            "ApiBaseUrl",
            value=Fn.join("", ["https://", api_distribution.distribution_domain_name, "/api"]),
        )
        CfnOutput(self, "BackendImageUri", value=backend_image.image_uri)
        CfnOutput(self, "AmplifyAppId", value=amplify_app_id)
        CfnOutput(self, "AmplifyDefaultDomain", value=amplify_default_domain)
        CfnOutput(self, "AmplifyBranchName", value=amplify_branch_name)
        CfnOutput(self, "AmplifyBranchUrl", value=frontend_url)
        CfnOutput(self, "RdsEndpoint", value=rds_instance.db_instance_endpoint_address)
        CfnOutput(self, "RdsSecretArn", value=rds_instance.secret.secret_arn if rds_instance.secret else "")
        CfnOutput(self, "RedisEndpointAddress", value=redis_cluster.attr_redis_endpoint_address)
        CfnOutput(self, "RedisEndpointPort", value=redis_cluster.attr_redis_endpoint_port)
        CfnOutput(self, "CognitoUserPoolId", value=user_pool.user_pool_id)
        CfnOutput(self, "CognitoUserPoolClientId", value=user_pool_client.user_pool_client_id)
        CfnOutput(self, "CognitoIssuer", value=cognito_issuer)
        CfnOutput(self, "CognitoHostedUiDomain", value=user_pool_domain.base_url())
        CfnOutput(self, "CognitoCallbackUrls", value=",".join(cognito_callback_urls))
        CfnOutput(self, "CognitoLogoutUrls", value=",".join(cognito_logout_urls))
        if reports_bucket:
            CfnOutput(self, "ReportsBucketName", value=reports_bucket.bucket_name)

    def _app_env(self) -> str:
        value = os.getenv("APP_ENV") or self.node.try_get_context("app_env")
        if value is None:
            value = self.node.try_get_context("environment_name") or "dev"
        return str(value).strip().lower()

    def _ctx_str(self, key: str, default: str) -> str:
        value = self.node.try_get_context(key)
        if value is None:
            return default
        return str(value)

    def _ctx_prod_str(self, key: str, dev_default: str, prod_default: str, is_prod: bool) -> str:
        value = self.node.try_get_context(key)
        if is_prod and (value is None or str(value) == dev_default):
            return prod_default
        if value is None:
            return prod_default if is_prod else dev_default
        return str(value)

    def _ctx_int(self, key: str, default: int) -> int:
        value = self.node.try_get_context(key)
        if value is None:
            return default
        return int(value)

    def _ctx_bool(self, key: str, default: bool) -> bool:
        value = self.node.try_get_context(key)
        if value is None:
            return default
        return self._bool_value(value)

    def _ctx_prod_bool(self, key: str, dev_default: bool, prod_default: bool, is_prod: bool) -> bool:
        value = self.node.try_get_context(key)
        if is_prod and (value is None or self._bool_value(value) == dev_default):
            return prod_default
        if value is None:
            return prod_default if is_prod else dev_default
        return self._bool_value(value)

    def _bool_value(self, value: Any) -> bool:
        if isinstance(value, bool):
            return value
        return str(value).strip().lower() in {"1", "true", "yes", "y", "on"}

    def _ctx_list(
        self,
        key: str,
        default: str,
        *,
        dev_default: str | None = None,
        prod_default: str | None = None,
        is_prod: bool = False,
    ) -> list[str]:
        value = self.node.try_get_context(key)
        if is_prod and prod_default is not None and (
            value is None or (dev_default is not None and str(value) == dev_default)
        ):
            value = prod_default
        if value is None:
            value = default
        if isinstance(value, list):
            return [str(item).strip() for item in value if str(item).strip()]
        return [item.strip() for item in str(value).split(",") if item.strip()]
