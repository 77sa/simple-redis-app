up:
	ENV=DEV docker-compose up
up-prod:
	ENV=PROD docker-compose up
down:
	docker-compose down
build:
	docker-compose build --no-cache
clean:
	docker image prune