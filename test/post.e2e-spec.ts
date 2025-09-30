/* eslint-disable */
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { CreatePostInputDto } from '../src/modules/content-manage/posts/api/input-dto/create-post.input.dto';
import { PostViewDto } from '../src/modules/content-manage/posts/api/view-dto/post.view-dto';
import { UpdatePostInputDto } from '../src/modules/content-manage/posts/api/input-dto/update-post.input.dto';
import { Server } from 'http';
import { E2ETestHelper } from './helpers/e2e-test-helper';

describe('PostController (e2e)', () => {
  let app: INestApplication;
  let server: Server;
  let createdPostId: string | null = null;
  let createdBlogId: string | null = null;

  // Базовые учетные данные для тестов
  const adminCredentials = Buffer.from('admin:qwerty').toString('base64');

  beforeAll(async () => {
    const testSetup = await E2ETestHelper.createTestingApp();
    app = testSetup.app;
    server = testSetup.server;

    // Создаем блог для тестирования постов
    const blogData = {
      name: 'Test Blog',
      description: 'This is a test blog for testing posts',
      websiteUrl: 'https://testblog.com',
      createdAt: new Date(),
      isMembership: false,
    };

    const blogResponse = await request(server)
      .post('/blogs')
      .set('Authorization', `Basic ${adminCredentials}`)
      .send(blogData)
      .expect(201);

    const blogResponseBody = blogResponse.body;
    createdBlogId = blogResponseBody.id;
  });

  afterAll(async () => {
    await E2ETestHelper.cleanup(app, server);
  });

  it('should create a post (POST)', async () => {
    const postData: CreatePostInputDto = {
      title: 'Test Post Title',
      shortDescription: 'This is a test post short description',
      content:
        'This is a test post content with sufficient length to meet validation requirements',
      blogId: createdBlogId!,
    };

    const response = await request(server)
      .post('/posts')
      .set('Authorization', `Basic ${adminCredentials}`)
      .send(postData)
      .expect(201);

    const responseBody = response.body as PostViewDto;

    expect(responseBody).toEqual({
      id: expect.any(String) as string,
      title: postData.title,
      shortDescription: postData.shortDescription,
      content: postData.content,
      blogId: postData.blogId,
      blogName: expect.any(String) as string,
      createdAt: expect.any(String) as string,
      extendedLikesInfo: {
        likesCount: 0,
        dislikesCount: 0,
        myStatus: 'None',
        newestLikes: [],
      },
    });

    createdPostId = responseBody.id;
  });

  it('should get post by ID (GET)', async () => {
    if (!createdPostId) {
      throw new Error('Post ID is not set');
    }

    const response = await request(server)
      .get(`/posts/${createdPostId}`)
      .expect(200);

    const responseBody = response.body as PostViewDto;
    expect(responseBody.id).toBe(createdPostId);
    expect(responseBody.title).toBe('Test Post Title');
  });

  it('should get all posts (GET)', async () => {
    const response = await request(server)
      .get('/posts')
      .query({
        pageNumber: 1,
        pageSize: 10,
        sortBy: 'createdAt',
        sortDirection: 'desc',
      })
      .expect(200);

    const responseBody = response.body;
    expect(responseBody).toHaveProperty('items');
    expect(responseBody).toHaveProperty('totalCount');
    expect(responseBody).toHaveProperty('page');
    expect(responseBody).toHaveProperty('pageSize');
    expect(Array.isArray(responseBody.items)).toBe(true);
    expect(responseBody.totalCount).toBeGreaterThan(0);
  });

  it('should update post (PUT)', async () => {
    if (!createdPostId) {
      throw new Error('Post ID is not set');
    }

    const updatedData: UpdatePostInputDto = {
      title: 'Updated Post Title',
      shortDescription: 'Updated short description',
      content:
        'Updated post content with sufficient length to meet validation requirements',
      blogId: createdBlogId!,
    };

    await request(server)
      .put(`/posts/${createdPostId}`)
      .set('Authorization', `Basic ${adminCredentials}`)
      .send(updatedData)
      .expect(204);

    // Проверяем, что данные обновились
    const response = await request(server)
      .get(`/posts/${createdPostId}`)
      .expect(200);

    const responseBody = response.body as PostViewDto;
    expect(responseBody.title).toBe(updatedData.title);
    expect(responseBody.shortDescription).toBe(updatedData.shortDescription);
    expect(responseBody.content).toBe(updatedData.content);
  });

  it('should delete post (DELETE)', async () => {
    if (!createdPostId) {
      throw new Error('Post ID is not set');
    }

    await request(server)
      .delete(`/posts/${createdPostId}`)
      .set('Authorization', `Basic ${adminCredentials}`)
      .expect(204);

    // Проверяем, что пост удалён
    await request(server).get(`/posts/${createdPostId}`).expect(404);
  });

  // Отдельные тесты для валидации
  it('should return 400 for empty title (POST)', async () => {
    await request(server)
      .post('/posts')
      .set('Authorization', `Basic ${adminCredentials}`)
      .send({
        title: '',
        shortDescription: 'Valid short description',
        content: 'Valid content with sufficient length',
        blogId: createdBlogId,
      })
      .expect(400);
  });

  it('should return 400 for title too long (POST)', async () => {
    await request(server)
      .post('/posts')
      .set('Authorization', `Basic ${adminCredentials}`)
      .send({
        title: 'A'.repeat(31), // Превышает максимальную длину 30 символов
        shortDescription: 'Valid short description',
        content: 'Valid content with sufficient length',
        blogId: createdBlogId,
      })
      .expect(400);
  });

  it('should return 400 for shortDescription too long (POST)', async () => {
    await request(server)
      .post('/posts')
      .set('Authorization', `Basic ${adminCredentials}`)
      .send({
        title: 'Valid Title',
        shortDescription: 'A'.repeat(101), // Превышает максимальную длину 100 символов
        content: 'Valid content with sufficient length',
        blogId: createdBlogId,
      })
      .expect(400);
  });

  it('should return 400 for empty shortDescription (POST)', async () => {
    await request(server)
      .post('/posts')
      .set('Authorization', `Basic ${adminCredentials}`)
      .send({
        title: 'Valid Title',
        shortDescription: '',
        content: 'Valid content with sufficient length',
        blogId: createdBlogId,
      })
      .expect(400);
  });

  it('should return 400 for content too long (POST)', async () => {
    await request(server)
      .post('/posts')
      .set('Authorization', `Basic ${adminCredentials}`)
      .send({
        title: 'Valid Title',
        shortDescription: 'Valid short description',
        content: 'A'.repeat(1001), // Превышает максимальную длину 1000 символов
        blogId: createdBlogId,
      })
      .expect(400);
  });

  it('should return 400 for empty content (POST)', async () => {
    await request(server)
      .post('/posts')
      .set('Authorization', `Basic ${adminCredentials}`)
      .send({
        title: 'Valid Title',
        shortDescription: 'Valid short description',
        content: '',
        blogId: createdBlogId,
      })
      .expect(400);
  });

  it('should return 400 for missing blogId (POST)', async () => {
    await request(server)
      .post('/posts')
      .set('Authorization', `Basic ${adminCredentials}`)
      .send({
        title: 'Valid Title',
        shortDescription: 'Valid short description',
        content: 'Valid content with sufficient length',
        // blogId отсутствует - обязательное поле
      })
      .expect(400);
  });

  // Объединенный тест для несуществующих ресурсов
  it('should return 404 for non-existent post', async () => {
    const fakeId = '65d8a6b1d4f1a04e8a0e0000'; // Несуществующий ID

    // GET
    await request(server).get(`/posts/${fakeId}`).expect(404);

    // PUT
    const updateData: UpdatePostInputDto = {
      title: 'Updated Title',
      shortDescription: 'Updated description',
      content: 'Updated content with sufficient length',
      blogId: createdBlogId!,
    };
    await request(server)
      .put(`/posts/${fakeId}`)
      .set('Authorization', `Basic ${adminCredentials}`)
      .send(updateData)
      .expect(404);

    // DELETE
    await request(server)
      .delete(`/posts/${fakeId}`)
      .set('Authorization', `Basic ${adminCredentials}`)
      .expect(404);
  });

  // Тесты для граничных значений
  it('should handle minimum length fields (POST)', async () => {
    const minLengthData: CreatePostInputDto = {
      title: 'ABCDEF', // Минимальная длина 6 символов
      shortDescription: 'ABCDEF', // Минимальная длина 6 символов
      content: 'ABCDEF', // Минимальная длина 6 символов
      blogId: createdBlogId!,
    };

    const response = await request(server)
      .post('/posts')
      .set('Authorization', `Basic ${adminCredentials}`)
      .send(minLengthData)
      .expect(201);

    const responseBody = response.body as PostViewDto;
    expect(responseBody.title).toBe(minLengthData.title);
    expect(responseBody.shortDescription).toBe(minLengthData.shortDescription);
    expect(responseBody.content).toBe(minLengthData.content);
  });

  it('should handle maximum length fields (POST)', async () => {
    const maxLengthData: CreatePostInputDto = {
      title: 'A'.repeat(30), // Максимальная длина 30 символов
      shortDescription: 'A'.repeat(100), // Максимальная длина 100 символов
      content: 'A'.repeat(1000), // Максимальная длина 1000 символов
      blogId: createdBlogId!,
    };

    const response = await request(server)
      .post('/posts')
      .set('Authorization', `Basic ${adminCredentials}`)
      .send(maxLengthData)
      .expect(201);

    const responseBody = response.body as PostViewDto;
    expect(responseBody.title).toBe(maxLengthData.title);
    expect(responseBody.shortDescription).toBe(maxLengthData.shortDescription);
    expect(responseBody.content).toBe(maxLengthData.content);
  });

  // Тесты для пагинации и сортировки
  it('should handle pagination parameters (GET)', async () => {
    const response = await request(server)
      .get('/posts')
      .query({
        pageNumber: 2,
        pageSize: 5,
        sortBy: 'title',
        sortDirection: 'asc',
      })
      .expect(200);

    const responseBody = response.body;
    expect(responseBody.page).toBe(2);
    expect(responseBody.pageSize).toBe(5);
    // sortBy и sortDirection не сохраняются в ответе, они только параметры запроса
  });

  it('should handle search by title (GET)', async () => {
    const response = await request(server)
      .get('/posts')
      .query({
        searchTitleTerm: 'Test',
        pageNumber: 1,
        pageSize: 10,
      })
      .expect(200);

    const responseBody = response.body;
    expect(responseBody.items).toBeDefined();
    expect(Array.isArray(responseBody.items)).toBe(true);
  });
});
