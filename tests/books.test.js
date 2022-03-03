const { expect } = require('chai');
const { Book } = require('../src/models');
const request = require('supertest');
const app = require('../src/app');

describe('/books', () => {
    before(async () => Book.sequelize.sync());

    beforeEach(async () => {
        await Book.destroy({ where: {} })
    })

    describe('with no records in the database', () => {
        describe('POST/books', () => {
            it('creates a new book in the database', async () => {
                const response = await request(app).post('/books').send({
                    title: 'Guide to Backend',
                    author: 'Dan Hembery',
                    genre: 'Fiction',
                    ISBN: '123456'
                });
                const newBookRecord = await Book.findByPk(response.body.id, {
                    raw: true,
                })
                expect(response.status).to.equal(201);
                expect(response.body.title).to.equal('Guide to Backend');
                expect(response.body.author).to.equal('Dan Hembery');
                expect(newBookRecord.title).to.equal('Guide to Backend');
                expect(newBookRecord.author).to.equal('Dan Hembery');
            });
        });
    });

    describe('with records in the database', () => {    
        let books;
    
        beforeEach(async () => {
          books = await Promise.all([
            Book.create({
               title: 'Guide to Backend',
               author: 'Dan Hembery',
               genre: 'Fiction',
               ISBN: '123456'
            }),

            Book.create({ 
               title: 'Big Book of Cats',
               author: 'Nyancat',
               genre: 'Feline Fantasy',
               ISBN: '789' 
            }),

            Book.create({ 
               title: 'REST Principles',
               author: 'Manchester Codes',
               genre: 'Non Fiction',
               ISBN: '112233'
            })
        ]);
    });
    
    describe('GET /books', () => {
        it('gets all books records', async () => {
            const response = await request(app).get('/books');
    
            expect(response.status).to.equal(200);
            expect(response.body.length).to.equal(3);
    
            response.body.forEach((book) => {
                const expected = books.find((a) => a.id === book.id);
    
                expect(book.title).to.equal(expected.title);
                expect(book.author).to.equal(expected.author);
                expect(book.genre).to.equal(expected.genre);
            });
        });
    });
    
    describe('GET /books/:id', () => {
        it('gets books record by id', async () => {
            const book = books[0];
            const response = await request(app).get(`/books/${book.id}`);
    
            expect(response.status).to.equal(200);
            expect(response.body.title).to.equal(book.title);
            expect(response.body.author).to.equal(book.author);

        });
    
        it('returns a 404 if the book does not exist', async () => {
            const response = await request(app).get('/books/12345');
    
            expect(response.status).to.equal(404);
            expect(response.body.error).to.equal('The book could not be found.');
        });
    });
    
    describe('PATCH /books/:id', () => {
        it('updates books ISBN by id', async () => {
            const book = books[0];
            const response = await request(app)
            .patch(`/books/${book.id}`)
            .send({ ISBN: '1.2.3.4' });
            const updatedBookRecord = await Book.findByPk(book.id, {
                raw: true,
            });
    
            expect(response.status).to.equal(200);
            expect(updatedBookRecord.ISBN).to.equal('1.2.3.4');
        });
    
        it('returns a 404 if the book does not exist', async () => {
            const response = await request(app)
            .patch('/books/12345')
            .send({ author: 'New Author' });
    
            expect(response.status).to.equal(404);
            expect(response.body.error).to.equal('The book could not be found.');
        });
    });
    
    describe('DELETE /books/:id', () => {
        it('deletes book record by id', async () => {
            const book = books[0];
            const response = await request(app).delete(`/books/${book.id}`);
            const deletedBook = await Book.findByPk(book.id, { raw: true });
    
            expect(response.status).to.equal(204);
            expect(deletedBook).to.equal(null);
        });
    
        it('returns a 404 if the reader does not exist', async () => {
            const response = await request(app).delete('/books/12345');
            
            expect(response.status).to.equal(404);
            expect(response.body.error).to.equal('The book could not be found.');

            });
        });
    });
});

