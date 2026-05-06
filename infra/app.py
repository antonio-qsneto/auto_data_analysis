#!/usr/bin/env python3
import os

import aws_cdk as cdk

from auto_data_analysis_infra.auto_data_analysis_stack import AutoDataAnalysisStack


app = cdk.App()

AutoDataAnalysisStack(
    app,
    "AutoDataAnalysisStack",
    env=cdk.Environment(
        account=os.getenv("CDK_DEFAULT_ACCOUNT"),
        region=os.getenv("CDK_DEFAULT_REGION"),
    ),
)

app.synth()
