# Infra AWS com CDK (Python)

Para rodar a aplicação localmente com backend em Docker, frontend via Vite e
login local sem Cognito, veja [`../LOCAL_DEVELOPMENT.md`](../LOCAL_DEVELOPMENT.md).

Este diretório cria a infraestrutura AWS para o backend Django usando:
- VPC (subnets públicas, privadas com NAT e isoladas)
- ECS Cluster + Fargate Service (web)
- Fargate Service (celery worker) e opcional celery beat
- ALB público para o backend
- Imagem Docker do backend publicada automaticamente pelo CDK em ECR asset
- CloudFront HTTPS para a API
- AWS Amplify Hosting para o frontend
- RDS PostgreSQL
- ElastiCache Redis
- Cognito User Pool + Hosted UI para login, cadastro, reset de senha e federação opcional com Google
- (Opcional) S3 bucket para relatórios

## Estrutura
- `app.py`: entrada da aplicação CDK
- `cdk.json`: contextos default
- `requirements.txt`: dependências CDK
- `auto_data_analysis_infra/auto_data_analysis_stack.py`: stack principal
- `BACKEND_MAPPING.md`: mapeamento do backend atual
- `scripts/build_and_push_backend.sh`: fluxo legado/manual de build/push no ECR
- `scripts/deploy.sh`: deploy local com `APP_ENV=prod`, CDK, secrets e upload Amplify
- `secrets/prod.env.example`: template local para secrets de produção

## Pré-requisitos
- AWS CLI autenticado
- Docker
- Node.js + `npx`
- Python 3.11+
- Bootstrap do CDK na conta/região alvo:
  - `cdk bootstrap aws://<ACCOUNT_ID>/<REGION>`

## Deploy de produção
1. Crie o arquivo local de secrets:
```bash
cd infra
cp secrets/prod.env.example secrets/prod.env
```

Preencha pelo menos:
- `DJANGO_SECRET_KEY`
- `GOOGLE_API_KEY`

2. Rode o deploy completo:
```bash
cd infra
APP_ENV=prod AWS_REGION=us-east-1 ./scripts/deploy.sh
```

Para publicar no Amplify ja existente informado no projeto, use:
```bash
cd infra
APP_ENV=prod \
AWS_REGION=us-east-1 \
FRONTEND_URL=https://main.d1wxfdqkne5owr.amplifyapp.com \
./scripts/deploy.sh
```

Quando `FRONTEND_URL` aponta para `*.amplifyapp.com`, o script infere
automaticamente o `AMPLIFY_APP_ID` e o branch. Para dominios customizados,
defina tambem `AMPLIFY_APP_ID` e `AMPLIFY_BRANCH`.

Se o CDK ja terminou e apenas o upload do frontend falhou, retome sem
reexecutar o deploy da infra:
```bash
cd infra
APP_ENV=prod \
AWS_REGION=us-east-1 \
FRONTEND_ONLY=true \
FRONTEND_URL=https://main.d1wxfdqkne5owr.amplifyapp.com \
./scripts/deploy.sh
```

Esse comando:
- cria/atualiza o secret `auto-data-analysis/prod/app` no Secrets Manager
- faz build e upload da imagem backend via CDK Docker asset
- provisiona/atualiza VPC, ECS, RDS, Redis, S3, Cognito, ALB, CloudFront e Amplify
- builda o frontend com os outputs do CDK
- publica `frontend/dist` no branch Amplify `prod`

## Synth de produção
```bash
cd infra
APP_ENV=prod npx cdk synth
```

## Contextos principais
- `project_name`, `environment_name`, `app_env`
- `web_desired_count`, `worker_desired_count`
- `fargate_cpu`, `fargate_memory_mib`
- `django_debug`, `django_allowed_hosts`, `cors_allowed_origins`, `frontend_url`
- `auth_mode`, `secure_ssl_redirect`
- `amplify_app_name`, `amplify_branch_name`
- `existing_amplify_app_id`, `existing_amplify_default_domain`
- `cognito_domain_prefix`
- `cognito_callback_urls`, `cognito_logout_urls`
- `cognito_google_client_id`
- `cognito_google_client_secret_arn`
- `cognito_google_client_secret_json_field`
- `db_name`, `db_username`, `db_multi_az`, `db_deletion_protection`
- `redis_node_type`, `redis_engine_version`
- `enable_celery_beat`
- `app_secret_arn`
- `existing_s3_bucket_name` ou `create_s3_bucket=true`

## Secret recomendado (`app_secret_arn`)
Secret JSON no AWS Secrets Manager contendo:
- `DJANGO_SECRET_KEY`
- `OPENAI_API_KEY`
- `GOOGLE_API_KEY`
- `OPENROUTER_API_KEY`
- `EMAIL_HOST_USER`
- `EMAIL_HOST_PASSWORD`
- `DEFAULT_FROM_EMAIL`

## Cognito / frontend
Em produção, `scripts/deploy.sh` configura o build do Vite automaticamente com
os outputs do CDK:

- `VITE_AUTH_MODE=cognito`
- `VITE_API_BASE_URL=<ApiBaseUrl>`
- `VITE_COGNITO_DOMAIN=<CognitoHostedUiDomain>`
- `VITE_COGNITO_USER_POOL_CLIENT_ID=<CognitoUserPoolClientId>`
- `VITE_COGNITO_REDIRECT_URI=<AmplifyBranchUrl>/auth/callback`
- `VITE_COGNITO_LOGOUT_URI=<AmplifyBranchUrl>/login`
