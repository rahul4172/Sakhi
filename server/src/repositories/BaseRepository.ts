import mongoose, { Model, Document } from 'mongoose';

export class BaseRepository<T extends Document> {
  protected model: Model<T>;

  constructor(model: Model<T>) {
    this.model = model;
  }

  async findById(id: string): Promise<T | null> {
    return this.model.findById(id).exec();
  }

  async findOne(query: any): Promise<T | null> {
    return this.model.findOne(query).exec();
  }

  async find(query: any = {}): Promise<T[]> {
    return this.model.find(query).exec();
  }

  async create(data: Partial<T>): Promise<T> {
    const document = new this.model(data);
    return document.save();
  }

  async update(query: any, data: any): Promise<T | null> {
    return this.model.findOneAndUpdate(query, data, { new: true }).exec();
  }

  async delete(query: any): Promise<boolean> {
    const result = await this.model.deleteOne(query).exec();
    return result.deletedCount === 1;
  }
}
