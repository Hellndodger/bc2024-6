# Використовуємо офіційний образ Node.js
FROM node:18

# Встановлюємо робочу теку
WORKDIR /usr/src/app

# Копіюємо package.json та package-lock.json
COPY package*.json ./

# Встановлюємо залежності
RUN npm install

# Копіюємо весь проект в контейнер
COPY . .

# Вказуємо команду для запуску сервера з nodemon
CMD ["npx", "nodemon", "-L", "--inspect=0.0.0.0:9229", "lab5.js"]

# Відкриваємо порти
EXPOSE 3000 9229
