const request = require('supertest');
const express = require('express');
const fs = require('fs').promises;
jest.mock('fs', () => ({ promises: { readFile: jest.fn(), writeFile: jest.fn() } }));

const { router: itemsRouter } = require('./items');

const app = express();
app.use(express.json());
app.use('/api/items', itemsRouter);

const mockData = [
  { id: 1, name: 'Apple', price: 10 },
  { id: 2, name: 'Banana', price: 20 },
  { id: 3, name: 'Cherry', price: 30 }
];

describe('Items API', () => {
  beforeEach(() => {
    require('fs').promises.readFile.mockReset();
    require('fs').promises.writeFile.mockReset();
  });

  describe('GET /api/items', () => {
    it('should return paginated items and total', async () => {
      require('fs').promises.readFile.mockResolvedValue(JSON.stringify(mockData));
      const res = await request(app).get('/api/items?limit=2&offset=1');
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('items');
      expect(res.body).toHaveProperty('total', 3);
      expect(res.body.items.length).toBe(2);
      expect(res.body.items[0].name).toBe('Banana');
    });
    it('should filter items by query', async () => {
      require('fs').promises.readFile.mockResolvedValue(JSON.stringify(mockData));
      const res = await request(app).get('/api/items?q=cher');
      expect(res.statusCode).toBe(200);
      expect(res.body.items.length).toBe(1);
      expect(res.body.items[0].name).toBe('Cherry');
      expect(res.body.total).toBe(1);
    });
    it('should handle read errors', async () => {
      require('fs').promises.readFile.mockRejectedValue(new Error('fail'));
      const res = await request(app).get('/api/items');
      expect(res.statusCode).toBe(500);
    });
  });

  describe('GET /api/items/:id', () => {
    it('should return item by id', async () => {
      require('fs').promises.readFile.mockResolvedValue(JSON.stringify(mockData));
      const res = await request(app).get('/api/items/2');
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('name', 'Banana');
    });
    it('should return 404 for missing item', async () => {
      require('fs').promises.readFile.mockResolvedValue(JSON.stringify(mockData));
      const res = await request(app).get('/api/items/999');
      expect(res.statusCode).toBe(404);
    });
    it('should handle read errors', async () => {
      require('fs').promises.readFile.mockRejectedValue(new Error('fail'));
      const res = await request(app).get('/api/items/1');
      expect(res.statusCode).toBe(500);
    });
  });

  describe('POST /api/items', () => {
    it('should add a new item and return it', async () => {
      require('fs').promises.readFile.mockResolvedValue(JSON.stringify(mockData));
      require('fs').promises.writeFile.mockResolvedValue();
      const newItem = { name: 'Date', price: 40 };
      const res = await request(app).post('/api/items').send(newItem);
      expect(res.statusCode).toBe(201);
      expect(res.body).toMatchObject(newItem);
      expect(res.body).toHaveProperty('id');
      expect(require('fs').promises.writeFile).toHaveBeenCalled();
    });
    it('should handle read errors', async () => {
      require('fs').promises.readFile.mockRejectedValue(new Error('fail'));
      const res = await request(app).post('/api/items').send({ name: 'fail', price: 0 });
      expect(res.statusCode).toBe(500);
    });
    it('should handle write errors', async () => {
      require('fs').promises.readFile.mockResolvedValue(JSON.stringify(mockData));
      require('fs').promises.writeFile.mockRejectedValue(new Error('fail'));
      const res = await request(app).post('/api/items').send({ name: 'fail', price: 0 });
      expect(res.statusCode).toBe(500);
    });
  });
}); 