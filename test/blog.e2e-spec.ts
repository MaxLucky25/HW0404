/* eslint-disable */
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { CreateBlogInputDto } from '../src/modules/content-manage/blogs/api/input-dto/create-blog.input.dto';
import { BlogViewDto } from '../src/modules/content-manage/blogs/api/view-dto/blog.view-dto';
import { UpdateBlogInputDto } from '../src/modules/content-manage/blogs/api/input-dto/update-blog.input.dto';
import { Server } from 'http';
import { E2ETestHelper } from './helpers/e2e-test-helper';

describe('BlogController (e2e)', () => {
  let app: INestApplication;
  let server: Server;
  let createdBlogId: string | null = null;

  // Базовые учетные данные для тестов
  const adminCredentials = Buffer.from('admin:qwerty').toString('base64');

  beforeAll(async () => {
    const testSetup = await E2ETestHelper.createTestingApp();
    app = testSetup.app;
    server = testSetup.server;
  });

  afterAll(async () => {
    await E2ETestHelper.cleanup(app, server);
  });

  it('should create a blog (POST)', async () => {
    const blogData: CreateBlogInputDto = {
      name: 'Test Blog',
      description: 'This is a test blog',
      websiteUrl: 'https://testblog.com',
      createdAt: new Date(),
      isMembership: false,
    };

    const response = await request(server)
      .post('/blogs')
      .set('Authorization', `Basic ${adminCredentials}`)
      .send(blogData)
      .expect(201);

    const responseBody = response.body as BlogViewDto;

    expect(responseBody).toEqual({
      id: expect.any(String) as string,
      name: blogData.name,
      description: blogData.description,
      websiteUrl: blogData.websiteUrl,
      createdAt: expect.any(String) as string,
      isMembership: expect.any(Boolean) as boolean,
    });

    createdBlogId = responseBody.id;
  });

  it('should get blog by ID (GET)', async () => {
    if (!createdBlogId) {
      throw new Error('Blog ID is not set');
    }

    const response = await request(server)
      .get(`/blogs/${createdBlogId}`)
      .expect(200);

    const responseBody = response.body as BlogViewDto;
    expect(responseBody.id).toBe(createdBlogId);
  });

  it('should update blog (PUT)', async () => {
    if (!createdBlogId) {
      throw new Error('Blog ID is not set');
    }

    const updatedData: UpdateBlogInputDto = {
      name: 'Updated Blog',
      description: 'Updated description',
      websiteUrl: 'https://updatedblog.com',
    };

    await request(server)
      .put(`/blogs/${createdBlogId}`)
      .set('Authorization', `Basic ${adminCredentials}`)
      .send(updatedData)
      .expect(204);

    // Проверяем, что данные обновились
    const response = await request(server)
      .get(`/blogs/${createdBlogId}`)
      .expect(200);

    const responseBody = response.body as BlogViewDto;
    expect(responseBody.name).toBe(updatedData.name);
  });

  it('should delete blog (DELETE)', async () => {
    if (!createdBlogId) {
      throw new Error('Blog ID is not set');
    }

    await request(server)
      .delete(`/blogs/${createdBlogId}`)
      .set('Authorization', `Basic ${adminCredentials}`)
      .expect(204);

    // Проверяем, что блог удалён
    await request(server).get(`/blogs/${createdBlogId}`).expect(404);
  });

  // Объединенный тест для валидации
  it('should return 400 for invalid blog data (POST)', async () => {
    const testCases = [
      {
        data: {
          name: '',
          description: 'Test21',
          websiteUrl: 'https://valid.com',
        },
        description: 'empty name',
      },
      {
        data: {
          name: 'A'.repeat(16), // Превышает максимальную длину 15 символов
          description: 'Valid',
          websiteUrl: 'https://valid.com',
        },
        description: 'name too long',
      },
      {
        data: {
          name: 'Test Blog',
          description: 'Test',
          websiteUrl: 'invalid-url',
        },
        description: 'invalid websiteUrl',
      },
    ];

    for (const testCase of testCases) {
      await request(server)
        .post('/blogs')
        .set('Authorization', `Basic ${adminCredentials}`)
        .send(testCase.data)
        .expect(400);
    }
  });

  it('should return 404 if blog does not exist (GET)', async () => {
    const fakeId = '65d8a6b1d4f1a04e8a0e0000'; // Несуществующий ID
    await request(server).get(`/blogs/${fakeId}`).expect(404);
  });

  it('should handle max length fields (POST)', async () => {
    const longName = 'A'.repeat(15); // Максимальная длина 15 символов
    const longDescription = 'B'.repeat(100); // Лимит 500 символов

    const response = await request(server)
      .post('/blogs')
      .set('Authorization', `Basic ${adminCredentials}`)
      .send({
        name: longName,
        description: longDescription,
        websiteUrl: 'https://valid.com',
      })
      .expect(201);

    const responseBody = response.body as BlogViewDto;
    expect(responseBody.name).toBe(longName);
  });
});
