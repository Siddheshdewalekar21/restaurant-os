#!/bin/bash

# AWS Deployment Script for RestaurantOS

# Exit on error
set -e

echo "Starting RestaurantOS deployment to AWS..."

# Build the Docker images
echo "Building Docker images..."
docker-compose build

# Tag the images for ECR
echo "Tagging images for ECR..."
aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com
docker tag restaurantos_app1:latest $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/restaurantos:latest
docker tag restaurantos_nginx:latest $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/restaurantos-nginx:latest

# Push the images to ECR
echo "Pushing images to ECR..."
docker push $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/restaurantos:latest
docker push $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/restaurantos-nginx:latest

# Update ECS service to use the new images
echo "Updating ECS service..."
aws ecs update-service --cluster restaurantos-cluster --service restaurantos-service --force-new-deployment

echo "Deployment completed successfully!" 