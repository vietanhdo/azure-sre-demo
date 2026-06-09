#!/usr/bin/env bash
set -euo pipefail

RED='\033[0;31m'
NC='\033[0m'

if [[ "${1:-}" == "--help" ]]; then
    echo "Usage: ./07-teardown.sh"
    echo "Destroys all Terraform infrastructure."
    exit 0
fi

read -p "Are you sure you want to destroy all infrastructure? (y/N) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${RED}Destroying infrastructure...${NC}"
    cd ../infra/terraform
    terraform destroy -auto-approve -var-file="../environments/demo/terraform.tfvars"
    echo -e "${RED}Destruction Complete!${NC}"
else
    echo "Aborted."
fi
