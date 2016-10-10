FROM ubuntu:14.04

RUN apt-get update && apt-get install -y --no-install-recommends \
		nodejs-legacy \
		npm \
	&& rm -rf /var/lib/apt/lists/*
RUN npm install -g grunt-cli
RUN npm install -g bower

COPY . /usr/src/gui/
WORKDIR /usr/src/gui
RUN npm install

EXPOSE 39738

CMD ["npm", "run", "dist"]
