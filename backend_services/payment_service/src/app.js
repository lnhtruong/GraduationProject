const express = require('express');
const routes = require('./routes');
const { errorMiddleware } = require('./middlewares');

const app = express();
app.use(express.json());

if (process.env.NODE_ENV === 'development') {
  const swaggerUi = require('swagger-ui-express');
  const swaggerJsdoc = require('swagger-jsdoc');
  const swaggerSpec = swaggerJsdoc({
    definition: {
      openapi: '3.0.0',
      info: { title: 'Payment Service', version: '1.0.0' },
      components: {
        securitySchemes: {
          bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
        },
      },
    },
    apis: [],
  });
  swaggerSpec.paths = {
    '/payment/create-payment': {
      post: { summary: 'Tạo link thanh toán', tags: ['Payment'], security: [{ bearerAuth: [] }], requestBody: { content: { 'application/json': { schema: { type: 'object', properties: { user_id: { type: 'integer' }, courseItems: { type: 'array', items: { type: 'object', properties: { course_id: { type: 'integer' }, price: { type: 'number' } } } }, totalAmount: { type: 'number' } } } } } }, responses: { 200: { description: 'OK' } } },
    },
    '/payment/buy-now': {
      post: { summary: 'Mua ngay 1 khoá', tags: ['Payment'], security: [{ bearerAuth: [] }], responses: { 200: { description: 'OK' } } },
    },
    '/payment/payos-callback': {
      post: { summary: 'Webhook callback từ PayOS', tags: ['Payment'], responses: { 200: { description: 'OK' } } },
    },
    '/payment/order-status/{orderCode}': {
      get: { summary: 'Kiểm tra trạng thái đơn hàng', tags: ['Payment'], parameters: [{ name: 'orderCode', in: 'path', required: true, schema: { type: 'string' } }], security: [{ bearerAuth: [] }], responses: { 200: { description: 'OK' } } },
    },
    '/payment/transactions': {
      get: { summary: 'Lấy danh sách giao dịch theo user', tags: ['Transactions'], security: [{ bearerAuth: [] }], parameters: [{ name: 'user_id', in: 'query', schema: { type: 'integer' } }], responses: { 200: { description: 'OK' } } },
    },
    '/payment/transactions/{id}': {
      get: { summary: 'Lấy chi tiết giao dịch', tags: ['Transactions'], security: [{ bearerAuth: [] }], parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }], responses: { 200: { description: 'OK' } } },
    },
  };
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
}

app.use('/', routes);
app.use(errorMiddleware);

module.exports = app;
