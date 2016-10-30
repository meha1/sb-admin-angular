FROM ubuntu:14.04

RUN apt-get update && apt-get install -y --no-install-recommends \
		nodejs-legacy \
		npm \
		git \
	&& rm -rf /var/lib/apt/lists/*
RUN npm install -g grunt-cli
RUN npm install -g bower

COPY bower.json Gruntfile.js LICENSE package.json README.md /usr/src/sb-admin-angular/
WORKDIR /usr/src/sb-admin-angular
RUN npm install

COPY app /usr/src/sb-admin-angular/app

RUN bower install --allow-root

RUN cp -R node_modules/chart.js bower_components/Chart.js
RUN cp -R node_modules/angular-chart.js bower_components/


EXPOSE 9000

CMD ["npm", "start"]
# CMD ["npm", "run", "dist"] // For deployment
