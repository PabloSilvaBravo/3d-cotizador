FROM php:8.2-fpm-alpine
RUN apk add --no-cache libcurl curl-dev \
    && docker-php-ext-install curl
CMD ["php-fpm"]
