#!/usr/bin/env bash
set -euo pipefail

GREEN='\033[0;32m'
NC='\033[0m'

if [[ "${1:-}" == "--help" ]]; then
    echo "Usage: ./01-infra-deploy.sh"
    echo "Deploys Terraform infrastructure."
    exit 0
fi

echo -e "${GREEN}Deploying Infrastructure...${NC}"
cd ../infra/terraform

terraform init
terraform plan -var-file="../environments/demo/terraform.tfvars" -out=tfplan
terraform apply -auto-approve tfplan

echo -e "${GREEN}Deployment Complete!${NC}"
echo "Key Outputs:"
terraform output
