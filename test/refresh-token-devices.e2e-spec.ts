/* eslint-disable */
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { CreateUserInputDto } from '../src/modules/auth-manage/user-accounts/api/input-dto/users.input-dto';
import { LoginInputDto } from '../src/modules/auth-manage/access-control/api/input-dto/login.input.dto';
import { MeViewDto } from '../src/modules/auth-manage/user-accounts/api/view-dto/users.view-dto';
import { Server } from 'http';
import { EmailService } from '../src/modules/auth-manage/access-control/application/helping-application/email.service';
import { E2ETestHelper } from './helpers/e2e-test-helper';

// Mock EmailService
const mockEmailService = {
  sendConfirmationEmail: jest.fn().mockResolvedValue(undefined),
  sendRecoveryEmail: jest.fn().mockResolvedValue(undefined),
};

// Helper function to extract refresh token from cookies
const extractRefreshToken = (cookies: string | string[]): string | null => {
  const cookiesArray = Array.isArray(cookies) ? cookies : [cookies];
  const refreshTokenCookie = cookiesArray.find((cookie: string) =>
    cookie.includes('refreshToken'),
  );
  return refreshTokenCookie
    ? refreshTokenCookie.split(';')[0].split('=')[1]
    : null;
};

// Helper function to check if refresh token exists in cookies
const hasRefreshToken = (cookies: string | string[]): boolean => {
  const cookiesArray = Array.isArray(cookies) ? cookies : [cookies];
  return cookiesArray.some((cookie: string) => cookie.includes('refreshToken'));
};

describe('RefreshToken and Devices (e2e)', () => {
  let app: INestApplication;
  let server: Server;
  let createdUserId: string | null = null;
  let accessToken: string | null = null;
  let refreshToken: string | null = null;

  // Basic Auth credentials для создания пользователей
  const basicAuth = 'Basic ' + Buffer.from('admin:qwerty').toString('base64');

  beforeAll(async () => {
    const testSetup = await E2ETestHelper.createTestingApp({
      overrideProviders: [
        { provide: EmailService, useValue: mockEmailService },
      ],
    });
    app = testSetup.app;
    server = testSetup.server;
  });

  afterAll(async () => {
    await E2ETestHelper.cleanup(app, server);
  });

  describe('RefreshToken Flow', () => {
    it('should remove all data (DELETE /testing/all-data)', async () => {
      await request(server).delete('/testing/all-data').expect(204);
    });

    it('should create new user (POST /users)', async () => {
      const userData: CreateUserInputDto = {
        login: 'testuser',
        password: 'testpassword123',
        email: 'test@example.com',
      };

      const response = await request(server)
        .post('/users')
        .set('Authorization', basicAuth)
        .send(userData)
        .expect(201);

      const userResponseBody = response.body;
      createdUserId = userResponseBody.id;
      expect(userResponseBody).toHaveProperty('id');
      expect(userResponseBody.login).toBe('testuser');
      expect(userResponseBody.email).toBe('test@example.com');
    });

    it('should sign in user (POST /auth/login)', async () => {
      const loginData: LoginInputDto = {
        loginOrEmail: 'testuser',
        password: 'testpassword123',
      };

      const response = await request(server)
        .post('/auth/login')
        .send(loginData)
        .expect(200);

      const loginResponseBody = response.body;
      expect(loginResponseBody).toHaveProperty('accessToken');
      expect(typeof loginResponseBody.accessToken).toBe('string');
      expect(loginResponseBody.accessToken.length).toBeGreaterThan(0);

      // Проверяем что refresh token установлен в cookie
      const cookies = response.headers['set-cookie'];
      expect(cookies).toBeDefined();
      expect(hasRefreshToken(cookies)).toBe(true);

      accessToken = loginResponseBody.accessToken;

      // Извлекаем refresh token из cookie для последующих тестов
      refreshToken = extractRefreshToken(cookies);
    });

    it('should return error when access token has expired or missing (GET /auth/me)', async () => {
      // Тест без токена
      await request(server).get('/auth/me').expect(401);

      // Тест с невалидным токеном
      await request(server)
        .get('/auth/me')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });

    it('should return error when refresh token has expired or missing (POST /auth/refresh-token, POST /auth/logout)', async () => {
      // Тест без refresh token
      await request(server).post('/auth/refresh-token').expect(401);
      await request(server).post('/auth/logout').expect(401);

      // Тест с невалидным refresh token
      await request(server)
        .post('/auth/refresh-token')
        .set('Cookie', 'refreshToken=invalid-token')
        .expect(401);

      await request(server)
        .post('/auth/logout')
        .set('Cookie', 'refreshToken=invalid-token')
        .expect(401);
    });

    it('should sign in user again (POST /auth/login)', async () => {
      const loginData: LoginInputDto = {
        loginOrEmail: 'testuser',
        password: 'testpassword123',
      };

      const response = await request(server)
        .post('/auth/login')
        .send(loginData)
        .expect(200);

      const loginResponseBody = response.body;
      expect(loginResponseBody).toHaveProperty('accessToken');
      expect(typeof loginResponseBody.accessToken).toBe('string');
      expect(loginResponseBody.accessToken.length).toBeGreaterThan(0);

      // Проверяем что refresh token установлен в cookie
      const cookies = response.headers['set-cookie'];
      expect(cookies).toBeDefined();
      expect(hasRefreshToken(cookies)).toBe(true);

      accessToken = loginResponseBody.accessToken;

      // Извлекаем refresh token из cookie
      refreshToken = extractRefreshToken(cookies);
    });

    it('should return new refresh and access tokens (POST /auth/refresh-token)', async () => {
      if (!refreshToken) {
        throw new Error('Refresh token is not set');
      }

      const response = await request(server)
        .post('/auth/refresh-token')
        .set('Cookie', `refreshToken=${refreshToken}`)
        .expect(200);

      const responseBody = response.body;
      expect(responseBody).toHaveProperty('accessToken');
      expect(typeof responseBody.accessToken).toBe('string');
      expect(responseBody.accessToken.length).toBeGreaterThan(0);

      // Проверяем что новый refresh token установлен в cookie
      const cookies = response.headers['set-cookie'];
      expect(cookies).toBeDefined();
      expect(hasRefreshToken(cookies)).toBe(true);

      // Обновляем токены
      accessToken = responseBody.accessToken;
      refreshToken = extractRefreshToken(cookies);
    });

    it('should return error if refresh token has become invalid (POST /auth/refresh-token, POST /auth/logout)', async () => {
      // Используем старый refresh token после обновления
      await request(server)
        .post('/auth/refresh-token')
        .set('Cookie', 'refreshToken=old-invalid-token')
        .expect(401);

      await request(server)
        .post('/auth/logout')
        .set('Cookie', 'refreshToken=old-invalid-token')
        .expect(401);
    });

    it('should check access token and return current user data (GET /auth/me)', async () => {
      if (!accessToken) {
        throw new Error('Access token is not set');
      }

      const response = await request(server)
        .get('/auth/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      const responseBody = response.body as MeViewDto;
      expect(responseBody).toHaveProperty('login');
      expect(responseBody).toHaveProperty('email');
      expect(responseBody).toHaveProperty('userId');
      expect(responseBody.login).toBe('testuser');
      expect(responseBody.email).toBe('test@example.com');
    });

    it('should make refresh token invalid (POST /auth/logout)', async () => {
      if (!refreshToken) {
        throw new Error('Refresh token is not set');
      }

      await request(server)
        .post('/auth/logout')
        .set('Cookie', `refreshToken=${refreshToken}`)
        .expect(204);
    });

    it('should return error if refresh token has become invalid after logout (POST /auth/refresh-token, POST /auth/logout)', async () => {
      if (!refreshToken) {
        throw new Error('Refresh token is not set');
      }

      // Пытаемся использовать refresh token после logout
      await request(server)
        .post('/auth/refresh-token')
        .set('Cookie', `refreshToken=${refreshToken}`)
        .expect(401);

      await request(server)
        .post('/auth/logout')
        .set('Cookie', `refreshToken=${refreshToken}`)
        .expect(401);
    });
  });

  describe('Devices Flow', () => {
    it('should remove all data (DELETE /testing/all-data)', async () => {
      await request(server).delete('/testing/all-data').expect(204);
    });

    it('should create new user (POST /users)', async () => {
      const userData: CreateUserInputDto = {
        login: 'deviceuser',
        password: 'devicepassword123',
        email: 'device@example.com',
      };

      const response = await request(server)
        .post('/users')
        .set('Authorization', basicAuth)
        .send(userData)
        .expect(201);

      const userResponseBody = response.body;
      createdUserId = userResponseBody.id;
      expect(userResponseBody).toHaveProperty('id');
      expect(userResponseBody.login).toBe('deviceuser');
      expect(userResponseBody.email).toBe('device@example.com');
    });

    it('should login user 4 times from different browsers and get device list (GET /security/devices)', async () => {
      const loginData: LoginInputDto = {
        loginOrEmail: 'deviceuser',
        password: 'devicepassword123',
      };

      const userAgents = [
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0',
      ];

      const deviceTitles = [
        'Chrome Windows',
        'Chrome Mac',
        'Chrome Linux',
        'Firefox Windows',
      ];

      // Логинимся 4 раза с разными User-Agent
      for (let i = 0; i < 4; i++) {
        await request(server)
          .post('/auth/login')
          .set('User-Agent', userAgents[i])
          .send({ ...loginData, title: deviceTitles[i] })
          .expect(200);
      }

      // Получаем список устройств (используем последний refresh token)
      const loginResponse = await request(server)
        .post('/auth/login')
        .set('User-Agent', userAgents[0])
        .send({ ...loginData, title: 'Current Device' })
        .expect(200);

      const cookies = loginResponse.headers['set-cookie'];
      const currentRefreshToken = extractRefreshToken(cookies);

      if (!currentRefreshToken) {
        throw new Error('Refresh token not found');
      }

      const devicesResponse = await request(server)
        .get('/security/devices')
        .set('Cookie', `refreshToken=${currentRefreshToken}`)
        .expect(200);

      const devices = devicesResponse.body;
      expect(Array.isArray(devices)).toBe(true);
      expect(devices.length).toBeGreaterThan(0);

      // Проверяем структуру устройства
      if (devices.length > 0) {
        expect(devices[0]).toHaveProperty('ip');
        expect(devices[0]).toHaveProperty('title');
        expect(devices[0]).toHaveProperty('lastActiveDate');
        expect(devices[0]).toHaveProperty('deviceId');
      }
    });

    it('should return error if device ID not found (DELETE /security/devices/:deviceId)', async () => {
      const loginData: LoginInputDto = {
        loginOrEmail: 'deviceuser',
        password: 'devicepassword123',
      };

      const loginResponse = await request(server)
        .post('/auth/login')
        .send(loginData)
        .expect(200);

      const cookies = loginResponse.headers['set-cookie'];
      const refreshToken = extractRefreshToken(cookies);

      if (!refreshToken) {
        throw new Error('Refresh token not found');
      }

      await request(server)
        .delete('/security/devices/non-existent-device-id')
        .set('Cookie', `refreshToken=${refreshToken}`)
        .expect(404);
    });

    it('should return error if auth credentials is incorrect (GET /security/devices, DELETE /security/devices/:deviceId, DELETE /security/devices)', async () => {
      // Тест без refresh token
      await request(server).get('/security/devices').expect(401);
      await request(server)
        .delete('/security/devices/some-device-id')
        .expect(401);
      await request(server).delete('/security/devices').expect(401);

      // Тест с невалидным refresh token
      await request(server)
        .get('/security/devices')
        .set('Cookie', 'refreshToken=invalid-token')
        .expect(401);

      await request(server)
        .delete('/security/devices/some-device-id')
        .set('Cookie', 'refreshToken=invalid-token')
        .expect(401);

      await request(server)
        .delete('/security/devices')
        .set('Cookie', 'refreshToken=invalid-token')
        .expect(401);
    });

    it('should return forbidden error when trying to delete device from another user (DELETE /security/devices/:sessionId)', async () => {
      // Создаем первого пользователя
      const user1Data: CreateUserInputDto = {
        login: 'user1',
        password: 'password123',
        email: 'user1@example.com',
      };

      await request(server)
        .post('/users')
        .set('Authorization', basicAuth)
        .send(user1Data)
        .expect(201);

      // Логинимся как первый пользователь
      const user1LoginResponse = await request(server)
        .post('/auth/login')
        .set(
          'User-Agent',
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        )
        .send({
          loginOrEmail: 'user1',
          password: 'password123',
          title: 'User1 Device',
        })
        .expect(200);

      const user1Cookies = user1LoginResponse.headers['set-cookie'];
      const user1RefreshToken = extractRefreshToken(user1Cookies);

      if (!user1RefreshToken) {
        throw new Error('User1 refresh token not found');
      }

      // Получаем список устройств первого пользователя
      const user1DevicesResponse = await request(server)
        .get('/security/devices')
        .set('Cookie', `refreshToken=${user1RefreshToken}`)
        .expect(200);

      const user1Devices = user1DevicesResponse.body;
      expect(Array.isArray(user1Devices)).toBe(true);
      expect(user1Devices.length).toBeGreaterThan(0);

      // Создаем второго пользователя
      const user2Data: CreateUserInputDto = {
        login: 'user2',
        password: 'password123',
        email: 'user2@example.com',
      };

      await request(server)
        .post('/users')
        .set('Authorization', basicAuth)
        .send(user2Data)
        .expect(201);

      // Логинимся как второй пользователь с тем же User-Agent
      const user2LoginResponse = await request(server)
        .post('/auth/login')
        .set(
          'User-Agent',
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        )
        .send({
          loginOrEmail: 'user2',
          password: 'password123',
          title: 'User2 Device',
        })
        .expect(200);

      const user2Cookies = user2LoginResponse.headers['set-cookie'];
      const user2RefreshToken = extractRefreshToken(user2Cookies);

      if (!user2RefreshToken) {
        throw new Error('User2 refresh token not found');
      }

      // Пытаемся удалить устройство первого пользователя, используя токен второго пользователя
      const deviceIdToDelete = user1Devices[0].deviceId;
      await request(server)
        .delete(`/security/devices/${deviceIdToDelete}`)
        .set('Cookie', `refreshToken=${user2RefreshToken}`)
        .expect(403);
    });

    it('should return new refresh and access tokens (POST /auth/refresh-token)', async () => {
      const loginData: LoginInputDto = {
        loginOrEmail: 'deviceuser',
        password: 'devicepassword123',
      };

      const loginResponse = await request(server)
        .post('/auth/login')
        .send(loginData)
        .expect(200);

      const cookies = loginResponse.headers['set-cookie'];
      const refreshToken = extractRefreshToken(cookies);

      if (!refreshToken) {
        throw new Error('Refresh token not found');
      }

      const response = await request(server)
        .post('/auth/refresh-token')
        .set('Cookie', `refreshToken=${refreshToken}`)
        .expect(200);

      const responseBody = response.body;
      expect(responseBody).toHaveProperty('accessToken');
      expect(typeof responseBody.accessToken).toBe('string');
      expect(responseBody.accessToken.length).toBeGreaterThan(0);

      // Проверяем что новый refresh token установлен в cookie
      const newCookies = response.headers['set-cookie'];
      expect(newCookies).toBeDefined();
      expect(hasRefreshToken(newCookies)).toBe(true);
    });

    it('should return error if refresh token has become invalid (POST /auth/refresh-token, POST /auth/logout)', async () => {
      await request(server)
        .post('/auth/refresh-token')
        .set('Cookie', 'refreshToken=invalid-token')
        .expect(401);

      await request(server)
        .post('/auth/logout')
        .set('Cookie', 'refreshToken=invalid-token')
        .expect(401);
    });

    it('should not change device id after refresh-token call, but should change LastActiveDate (GET /security/devices)', async () => {
      const loginData: LoginInputDto = {
        loginOrEmail: 'deviceuser',
        password: 'devicepassword123',
      };

      const loginResponse = await request(server)
        .post('/auth/login')
        .send(loginData)
        .expect(200);

      const cookies = loginResponse.headers['set-cookie'];
      const refreshToken = extractRefreshToken(cookies);

      if (!refreshToken) {
        throw new Error('Refresh token not found');
      }

      // Получаем список устройств до refresh
      const devicesBeforeResponse = await request(server)
        .get('/security/devices')
        .set('Cookie', `refreshToken=${refreshToken}`)
        .expect(200);

      const devicesBefore = devicesBeforeResponse.body;
      expect(Array.isArray(devicesBefore)).toBe(true);
      expect(devicesBefore.length).toBeGreaterThan(0);

      const deviceIdBefore = devicesBefore[0].deviceId;
      const lastActiveDateBefore = devicesBefore[0].lastActiveDate;

      // Ждем немного чтобы время изменилось
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Выполняем refresh token
      const refreshResponse = await request(server)
        .post('/auth/refresh-token')
        .set('Cookie', `refreshToken=${refreshToken}`)
        .expect(200);

      const newCookies = refreshResponse.headers['set-cookie'];
      const newRefreshToken = extractRefreshToken(newCookies);

      if (!newRefreshToken) {
        throw new Error('New refresh token not found');
      }

      // Получаем список устройств после refresh
      const devicesAfterResponse = await request(server)
        .get('/security/devices')
        .set('Cookie', `refreshToken=${newRefreshToken}`)
        .expect(200);

      const devicesAfter = devicesAfterResponse.body;
      expect(Array.isArray(devicesAfter)).toBe(true);
      expect(devicesAfter.length).toBeGreaterThan(0);

      const deviceIdAfter = devicesAfter[0].deviceId;
      const lastActiveDateAfter = devicesAfter[0].lastActiveDate;

      // Device ID не должен измениться
      expect(deviceIdAfter).toBe(deviceIdBefore);

      // LastActiveDate должен измениться
      expect(new Date(lastActiveDateAfter).getTime()).toBeGreaterThan(
        new Date(lastActiveDateBefore).getTime(),
      );
    });

    it('should delete device from device list by deviceId (DELETE /security/devices/:deviceId)', async () => {
      const loginData: LoginInputDto = {
        loginOrEmail: 'deviceuser',
        password: 'devicepassword123',
      };

      const loginResponse = await request(server)
        .post('/auth/login')
        .send(loginData)
        .expect(200);

      const cookies = loginResponse.headers['set-cookie'];
      const refreshToken = extractRefreshToken(cookies);

      if (!refreshToken) {
        throw new Error('Refresh token not found');
      }

      // Получаем список устройств
      const devicesResponse = await request(server)
        .get('/security/devices')
        .set('Cookie', `refreshToken=${refreshToken}`)
        .expect(200);

      const devices = devicesResponse.body;
      expect(Array.isArray(devices)).toBe(true);
      expect(devices.length).toBeGreaterThan(0);

      const deviceIdToDelete = devices[0].deviceId;

      // Удаляем устройство
      await request(server)
        .delete(`/security/devices/${deviceIdToDelete}`)
        .set('Cookie', `refreshToken=${refreshToken}`)
        .expect(204);

      // Проверяем что устройство удалено
      const devicesAfterResponse = await request(server)
        .get('/security/devices')
        .set('Cookie', `refreshToken=${refreshToken}`)
        .expect(200);

      const devicesAfter = devicesAfterResponse.body;
      const deletedDevice = devicesAfter.find(
        (device: any) => device.deviceId === deviceIdToDelete,
      );
      expect(deletedDevice).toBeUndefined();
    });

    it('should return error if refresh token has become invalid (POST /auth/refresh-token, POST /auth/logout)', async () => {
      await request(server)
        .post('/auth/refresh-token')
        .set('Cookie', 'refreshToken=invalid-token')
        .expect(401);

      await request(server)
        .post('/auth/logout')
        .set('Cookie', 'refreshToken=invalid-token')
        .expect(401);
    });

    it('should return device list without logged out device (GET /security/devices after POST /auth/logout)', async () => {
      const loginData: LoginInputDto = {
        loginOrEmail: 'deviceuser',
        password: 'devicepassword123',
      };

      const loginResponse = await request(server)
        .post('/auth/login')
        .send(loginData)
        .expect(200);

      const cookies = loginResponse.headers['set-cookie'];
      const refreshToken = extractRefreshToken(cookies);

      if (!refreshToken) {
        throw new Error('Refresh token not found');
      }

      // Получаем список устройств до logout
      const devicesBeforeResponse = await request(server)
        .get('/security/devices')
        .set('Cookie', `refreshToken=${refreshToken}`)
        .expect(200);

      const devicesBefore = devicesBeforeResponse.body;
      const initialDeviceCount = devicesBefore.length;

      // Выполняем logout
      await request(server)
        .post('/auth/logout')
        .set('Cookie', `refreshToken=${refreshToken}`)
        .expect(204);

      // Пытаемся получить список устройств после logout (должен вернуть 200, так как logout не инвалидирует refresh token)
      await request(server)
        .get('/security/devices')
        .set('Cookie', `refreshToken=${refreshToken}`)
        .expect(200);
    });

    it('should return error if refresh token has become invalid (POST /auth/refresh-token, POST /auth/logout)', async () => {
      await request(server)
        .post('/auth/refresh-token')
        .set('Cookie', 'refreshToken=invalid-token')
        .expect(401);

      await request(server)
        .post('/auth/logout')
        .set('Cookie', 'refreshToken=invalid-token')
        .expect(401);
    });

    it('should delete all other devices from device list (DELETE /security/devices)', async () => {
      const loginData: LoginInputDto = {
        loginOrEmail: 'deviceuser',
        password: 'devicepassword123',
      };

      // Создаем несколько сессий
      const userAgents = [
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36',
      ];

      for (let i = 0; i < 3; i++) {
        await request(server)
          .post('/auth/login')
          .set('User-Agent', userAgents[i])
          .send({ ...loginData, title: `Device ${i + 1}` })
          .expect(200);
      }

      // Логинимся еще раз для получения refresh token
      const loginResponse = await request(server)
        .post('/auth/login')
        .set(
          'User-Agent',
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        )
        .send({ ...loginData, title: 'Current Device' })
        .expect(200);

      const cookies = loginResponse.headers['set-cookie'];
      const refreshToken = extractRefreshToken(cookies);

      if (!refreshToken) {
        throw new Error('Refresh token not found');
      }

      // Получаем список устройств до удаления
      const devicesBeforeResponse = await request(server)
        .get('/security/devices')
        .set('Cookie', `refreshToken=${refreshToken}`)
        .expect(200);

      const devicesBefore = devicesBeforeResponse.body;
      expect(devicesBefore.length).toBeGreaterThan(1);

      // Удаляем все устройства кроме текущего
      await request(server)
        .delete('/security/devices')
        .set('Cookie', `refreshToken=${refreshToken}`)
        .expect(204);

      // Проверяем что осталось только одно устройство
      const devicesAfterResponse = await request(server)
        .get('/security/devices')
        .set('Cookie', `refreshToken=${refreshToken}`)
        .expect(200);

      const devicesAfter = devicesAfterResponse.body;
      expect(devicesAfter.length).toBe(1);
    });

    it('should return error if refresh token has become invalid (POST /auth/refresh-token, POST /auth/logout)', async () => {
      await request(server)
        .post('/auth/refresh-token')
        .set('Cookie', 'refreshToken=invalid-token')
        .expect(401);

      await request(server)
        .post('/auth/logout')
        .set('Cookie', 'refreshToken=invalid-token')
        .expect(401);
    });
  });
});
