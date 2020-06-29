const supertest = require('supertest');
const mongoose = require('mongoose');
const helper = require('./test_helper');
const app = require('../app');
const api = supertest(app);

const Post = require('../models/post');

describe('when there is initially some posts saved', () => {
  beforeEach(async () => {
    await Post.deleteMany({});
    await Post.insertMany(helper.initialPosts);
  });

  // The other way

  /*  console.log('BeforeEach');
    await Post.deleteMany({});

    const postObjects = helper.initialPosts.map((post) => new Post(post));
    const promiseArray = postObjects.map((post) => post.save());
    await Promise.all(promiseArray);
  }); */

  test('posts are returned as json', async () => {
    await api
      .get('/api/posts')
      .expect(200)
      .expect('Content-Type', /application\/json/);
  });

  test('there are two posts', async () => {
    const response = await api.get('/api/posts');

    expect(response.body).toHaveLength(2);
  });

  test('all posts are returned', async () => {
    const response = await api.get('/api/posts');

    expect(response.body).toHaveLength(helper.initialPosts.length);
  });

  test('the first post is about Igors blog', async () => {
    const response = await api.get('/api/posts');

    expect(response.body[0].title).toBe('Igor speaks');
  });

  test('a specific author is within the returned posts', async () => {
    const response = await api.get('/api/posts');

    const contents = response.body.map((r) => r.author);

    expect(contents).toContainEqual('Jimmy James');
  });

  describe('viewing a specific post', () => {
    test('succeeds with a valid id', async () => {
      const postsAtStart = await helper.postsInDb();

      const postsToView = postsAtStart[0];

      const resultPost = await api
        .get(`/api/posts/${postsToView.id}`)
        .expect(200)
        .expect('Content-Type', /application\/json/);

      expect(resultPost.body).toEqual(postsToView);
    });

    test('fails with statuscode 404 if post does not exist', async () => {
      const validNonexistingId = await helper.nonExistingId();

      console.log(validNonexistingId);

      await api.get(`/api/posts/${validNonexistingId}`).expect(404);
    });

    test('fails with statuscode 400 when id is invalid', async () => {
      const invalidId = '35007';

      await api.get(`/api/posts/${invalidId}`).expect(400);
    });
  });

  test('there is a id', async () => {
    expect(helper.nonExistingId()).toBeDefined(helper.initialPosts.id);
  });

  describe('addition of a new post', () => {
    test('a valid new post can be added', async () => {
      const newPost = {
        title: 'New blog post',
        author: 'John Wayne',
        url: 'https://yourdomain.com/info',
        likes: 13,
      };

      await api
        .post('/api/posts')
        .send(newPost)
        .expect(200)
        .expect('Content-Type', /application\/json/);

      const postsAtEnd = await helper.postsInDb();
      expect(postsAtEnd.length).toBe(helper.initialPosts.length + 1);

      const author = postsAtEnd.map((n) => n.author);
      expect(author).toContain('John Wayne');
    });

    test('post without title is not added', async () => {
      const newPostNoTitle = {
        author: 'Wayne Gretzky',
        url: 'http://localhost:3001/',
        likes: 0,
      };

      await api.post('/api/posts').send(newPostNoTitle).expect(400);

      const postsAtEnd = await helper.postsInDb();
      console.log(postsAtEnd);
      expect(postsAtEnd.length).toBe(helper.initialPosts.length);
    });

    test('post without url is not added', async () => {
      const newPostNoUrl = {
        title: 'Hockey blog',
        author: 'Wayne Gretzky',
        likes: 0,
      };

      await api.post('/api/posts').send(newPostNoUrl).expect(400);

      const postsAtEnd = await helper.postsInDb();
      console.log(postsAtEnd);
      expect(postsAtEnd.length).toBe(helper.initialPosts.length);
    });

    test('post without likes returns zero likes', async () => {
      const newPost = {
        title: 'Nobody likes this blog',
        author: 'Wayne Gretzky',
        url: 'http://localhost:3001/',
      };

      await api
        .post('/api/posts')
        .send(newPost)
        .expect(200)
        .expect('Content-Type', /application\/json/);

      const postsAtEnd = await helper.postsInDb();
      console.log(postsAtEnd);
      expect(postsAtEnd).toHaveLength(helper.initialPosts.length + 1);
    });
  });

  describe('deletion of a post', () => {
    test('a post can be deleted', async () => {
      const postsAtStart = await helper.postsInDb();
      const postToDelete = postsAtStart[0];

      await api.delete(`/api/posts/${postToDelete.id}`).expect(204);

      const postsAtEnd = await helper.postsInDb();

      expect(postsAtEnd).toHaveLength(helper.initialPosts.length - 1);

      const title = postsAtEnd.map((r) => r.title);

      expect(title).not.toContainEqual(postToDelete.title);
    });
  });
});

afterAll(() => {
  mongoose.connection.close();
});
