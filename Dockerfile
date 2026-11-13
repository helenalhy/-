FROM node:20
WORKDIR /app
RUN npm install -g pnpm@10
COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm --filter @workspace/api-server run build
EXPOSE 7860
CMD ["node", "--enable-source-maps", "artifacts/api-server/dist/index.mjs"]
