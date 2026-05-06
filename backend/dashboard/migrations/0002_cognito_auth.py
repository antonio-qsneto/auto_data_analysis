from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("dashboard", "0001_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="customuser",
            name="cognito_sub",
            field=models.CharField(blank=True, max_length=255, null=True, unique=True),
        ),
        migrations.AddField(
            model_name="customuser",
            name="cognito_username",
            field=models.CharField(blank=True, db_index=True, max_length=255, null=True),
        ),
        migrations.RemoveField(
            model_name="customuser",
            name="google_id",
        ),
        migrations.DeleteModel(
            name="PasswordResetToken",
        ),
    ]
