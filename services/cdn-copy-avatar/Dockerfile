# Base image for copying default avatar to shared volume
FROM nginx:stable-alpine

# Update packages for security-fixes
RUN set -eux; \
	apk update && apk upgrade --no-cache && \
	rm -rf /var/cache/apk/*

COPY ./data/base_avatar.png /tmp/base_avatar.png

CMD ["cp", "/tmp/base_avatar.png", "/data/cdn/avatars"]
