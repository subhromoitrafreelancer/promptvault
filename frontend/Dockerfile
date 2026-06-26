FROM nginx:1.25-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY html/ /usr/share/nginx/html/
COPY js/   /usr/share/nginx/html/js/
COPY css/  /usr/share/nginx/html/css/
EXPOSE 80
