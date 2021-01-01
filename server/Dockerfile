FROM node:14

# создание директории приложения
WORKDIR /usr/src/app

# установка зависимостей
# символ астериск ("*") используется для того чтобы по возможности 
# скопировать оба файла: package.json и package-lock.json
COPY package.json ./
COPY yarn.lock ./

# устанавливаем зависимости
RUN yarn
# копируем исходный код
COPY . .
COPY .env.production .env

RUN yarn build

ENV NODE_ENV production

EXPOSE 8080
CMD [ "node", "dist/index.js" ]
# At the end, set the user to use when running this image
USER node