const supertest = require('supertest');
const mongoose = require('mongoose');
const helper = require('./test_helper');
const app = require('../app');
const api = supertest(app);
const bcrypt = require('bcrypt');

const User = require('../models/user');

const Post = require('../models/post');

describe('when there is initially some posts saved', () => {
  beforeEach(async () => {
    await User.deleteMany({});

    const passwordHash = await bcrypt.hash('sekret', 10);
    const user = new User({
      username: 'root',
      passwordHash,
    });

    await user.save();

    const testUser = await helper.usersInDb();

    const posts = await helper.initialPosts.map((post) => {
      return {
        ...post,
        user: testUser[0].id,
      };
    });

    await Post.deleteMany({});
    await Post.insertMany(posts);
  });

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
    // THIS DOES NOT WORK - FIX LATER...

    /* test('succeeds with a valid id', async () => {
      const postsAtStart = await helper.postsInDb();

      const postsToView = postsAtStart[0];
      console.log(postsToView);

      const resultPost = await api
        .get(`/api/posts/${postsToView.id}`)
        .expect(200)
        .expect('Content-Type', /application\/json/);
      console.log(resultPost.body);

      expect(resultPost.body).toEqual(postsToView);
    }); */

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
      const user = { username: 'root', password: 'sekret' };
      const authResponse = await api.post('/api/login').send(user);
      const token = `bearer ${authResponse.body.token}`;

      const newPost = {
        title: 'New blog post',
        author: 'John Wayne',
        url: 'https://yourdomain.com/info',
        likes: 13,
      };

      await api
        .post('/api/posts')
        .set('Authorization', token)
        .send(newPost)
        .expect(200)
        .expect('Content-Type', /application\/json/);

      const postsAtEnd = await helper.postsInDb();
      expect(postsAtEnd.length).toBe(helper.initialPosts.length + 1);

      const author = postsAtEnd.map((n) => n.author);
      expect(author).toContain('John Wayne');
    });

    test('post without title is not added', async () => {
      const user = { username: 'root', password: 'sekret' };
      const authResponse = await api.post('/api/login').send(user);
      const token = `bearer ${authResponse.body.token}`;

      const newPostNoTitle = {
        author: 'Wayne Gretzky',
        url: 'http://localhost:3001/',
        likes: 0,
      };

      await api
        .post('/api/posts')
        .set('Authorization', token)
        .send(newPostNoTitle)
        .expect(400);

      const postsAtEnd = await helper.postsInDb();
      console.log(postsAtEnd);
      expect(postsAtEnd.length).toBe(helper.initialPosts.length);
    });

    test('post without url is not added', async () => {
      const user = { username: 'root', password: 'sekret' };
      const authResponse = await api.post('/api/login').send(user);
      const token = `bearer ${authResponse.body.token}`;

      const newPostNoUrl = {
        title: 'Hockey blog',
        author: 'Wayne Gretzky',
        likes: 0,
      };

      await api
        .post('/api/posts')
        .set('Authorization', token)
        .send(newPostNoUrl)
        .expect(400);

      const postsAtEnd = await helper.postsInDb();
      console.log(postsAtEnd);
      expect(postsAtEnd.length).toBe(helper.initialPosts.length);
    });

    test('post without likes returns zero likes', async () => {
      const user = { username: 'root', password: 'sekret' };
      const authResponse = await api.post('/api/login').send(user);
      const token = `bearer ${authResponse.body.token}`;

      const newPost = {
        title: 'Nobody likes this blog',
        author: 'Wayne Gretzky',
        url: 'http://localhost:3001/',
      };

      await api
        .post('/api/posts')
        .set('Authorization', token)
        .send(newPost)
        .expect(200)
        .expect('Content-Type', /application\/json/);

      const postsAtEnd = await helper.postsInDb();
      console.log(postsAtEnd);
      expect(postsAtEnd).toHaveLength(helper.initialPosts.length + 1);
    });

    test('without token results in Unauthorized', async () => {
      const newPost = {
        title: 'USSR going down',
        author: 'Boris Jeltsin',
        url: 'http://localhost:3001/',
        likes: 0,
      };

      await api.post('/api/posts').send(newPost).expect(401);
    });
  });

  describe('deletion of a post', () => {
    test('a post can be deleted', async () => {
      const user = { username: 'root', password: 'sekret' };
      const authResponse = await api.post('/api/login').send(user);
      const token = `bearer ${authResponse.body.token}`;

      const postsAtStart = await helper.postsInDb();
      const postToDelete = postsAtStart[0];

      await api
        .delete(`/api/posts/${postToDelete.id}`)
        .set('Authorization', token)
        .expect(204);

      const postsAtEnd = await helper.postsInDb();

      expect(postsAtEnd).toHaveLength(helper.initialPosts.length - 1);

      const title = postsAtEnd.map((r) => r.title);

      expect(title).not.toContainEqual(postToDelete.title);
    });
  });

  describe('when there is initially one user at db', () => {
    test('creation succeeds with a fresh username', async () => {
      const usersAtStart = await helper.usersInDb();
      console.log(usersAtStart);

      const newUser = {
        username: 'jiihaa',
        name: 'Mauno Ahonen',
        password: 'salainen',
      };

      await api
        .post('/api/users')
        .send(newUser)
        .expect(200)
        .expect('Content-Type', /application\/json/);

      const usersAtEnd = await helper.usersInDb();
      expect(usersAtEnd).toHaveLength(usersAtStart.length + 1);

      const usernames = usersAtEnd.map((u) => u.username);
      expect(usernames).toContain(newUser.username);
    });

    test('creation fails with proper statuscode and message if username already taken', async () => {
      const usersAtStart = await helper.usersInDb();

      const newUser = {
        username: 'root',
        name: 'Superuser',
        password: 'salainen',
      };

      const result = await api
        .post('/api/users')
        .send(newUser)
        .expect(400)
        .expect('Content-Type', /application\/json/);

      expect(result.body.error).toContain('`username` to be unique');

      const usersAtEnd = await helper.usersInDb();
      expect(usersAtEnd).toHaveLength(usersAtStart.length);
    });
  });
});

afterAll(() => {
  mongoose.connection.close();
});
