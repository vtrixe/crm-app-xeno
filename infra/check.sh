#!/bin/bash


source .env


MYSQL_STATUS=$(docker inspect -f '{{.State.Running}}' crm_mysql)
if [ "$MYSQL_STATUS" == "true" ]; then
  echo "MySQL is running."
else
  echo "MySQL is not running. Please check the container logs."
fi


REDIS_STATUS=$(docker inspect -f '{{.State.Running}}' crm_redis)
if [ "$REDIS_STATUS" == "true" ]; then
  echo "Redis is running."
else
  echo "Redis is not running. Please check the container logs."
fi


RABBITMQ_STATUS=$(docker inspect -f '{{.State.Running}}' crm_rabbitmq)
if [ "$RABBITMQ_STATUS" == "true" ]; then
  echo "RabbitMQ is running."
else
  echo "RabbitMQ is not running. Please check the container logs."
fi
