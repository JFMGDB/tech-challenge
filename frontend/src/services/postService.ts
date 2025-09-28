import api from './api';
import { 
  Post, 
  PostsResponse, 
  CreatePostRequest, 
  UpdatePostRequest 
} from '../types';

export interface PostQuery {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
  search?: string;
  tags?: string | string[];
  // Optional convenience filter: maps to `tags` (first-class category)
  category?: string;
  authorId?: number;
}

export const postService = {
  async getPosts(query: PostQuery = {}): Promise<PostsResponse> {
    const params = new URLSearchParams();

    // Build tags filter, honoring optional `category`
    const tagParts: string[] = [];
    if (query.category) {
      tagParts.push(query.category);
    }
    if (query.tags) {
      if (Array.isArray(query.tags)) {
        tagParts.push(...query.tags);
      } else if (query.tags) {
        // support csv passed directly
        tagParts.push(...query.tags.split(',').map((t) => t.trim()).filter(Boolean));
      }
    }
    const uniqueTags = Array.from(new Set(tagParts.filter(Boolean)));

    // Append non-tag params
    Object.entries(query).forEach(([key, value]) => {
      if (value === undefined) return;
      if (key === 'tags' || key === 'category') return;
      params.append(key, value.toString());
    });

    if (uniqueTags.length > 0) {
      params.append('tags', uniqueTags.join(','));
    }
    
    const response = await api.get<PostsResponse>(`/posts?${params.toString()}`);
    return response.data;
  },

  async getPostById(id: number): Promise<{ post: Post }> {
    const response = await api.get<{ post: Post }>(`/posts/${id}`);
    return response.data;
  },

  async createPost(postData: CreatePostRequest): Promise<{ message: string; post: Post }> {
    const response = await api.post<{ message: string; post: Post }>('/posts', postData);
    return response.data;
  },

  async updatePost(id: number, postData: UpdatePostRequest): Promise<{ message: string; post: Post }> {
    const response = await api.put<{ message: string; post: Post }>(`/posts/${id}`, postData);
    return response.data;
  },

  async deletePost(id: number): Promise<{ message: string }> {
    const response = await api.delete<{ message: string }>(`/posts/${id}`);
    return response.data;
  },

  async likePost(id: number): Promise<{ message: string; liked: boolean }> {
    const response = await api.post<{ message: string; liked: boolean }>(`/posts/${id}/like`);
    return response.data;
  },
};