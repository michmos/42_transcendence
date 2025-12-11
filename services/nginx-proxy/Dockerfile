# Nginx stage to serve the web application
FROM nginx:stable-alpine

COPY ./config/nginx.conf /etc/nginx/nginx.conf

# Update packages for security-fixes
RUN set -eux; \
	apk update && apk upgrade --no-cache && \
	rm -rf /var/cache/apk/*


# Generate self-signed SSL certificate (for testing purposes only)
RUN apk add --no-cache openssl && \
	openssl req -x509 -nodes -days 365 \
	-subj "/C=US/ST=Denial/L=Springfield/O=Dis/CN=localhost" \
	-newkey rsa:2048 \
	-keyout /etc/ssl/private/nginx-selfsigned.key \
	-out /etc/ssl/certs/nginx-selfsigned.crt


EXPOSE 443
EXPOSE 80