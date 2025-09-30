import { Controller, Delete, HttpCode, HttpStatus } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';

@ApiTags('testing')
@Controller('testing')
export class TestingController {
  constructor(@InjectConnection() private readonly dbConnection: Connection) {}

  @Delete(':all-data')
  @ApiOperation({ summary: 'Delete all data (test endpoint)' })
  @ApiParam({ name: 'all-data', description: 'Delete all data' })
  @ApiResponse({ status: 204, description: 'All data deleted' })
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteAll() {
    const collection = await this.dbConnection.listCollections();

    const promises = collection.map((collection) =>
      this.dbConnection.collection(collection.name).deleteMany({}),
    );
    await Promise.all(promises);
  }
}
