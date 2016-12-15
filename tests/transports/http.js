const transports = require('../../lib/transports')
const codecs = require('../../lib/codecs')
const errors = require('../../lib/errors')
const document = require('../../lib/document')
const testUtils = require('../__helpers__/utils')

describe('Test the HTTPTransport', function () {
  const decoders = [new codecs.JSONCodec(), new codecs.JSONCodec(), new codecs.TextCodec()]

  it('should check the action function of an HTTP transport (text/html)', function () {
    const url = 'http://www.example.com/'
    const link = new document.Link(url, 'get')
    const transport = new transports.HTTPTransport(null, testUtils.mockedFetch('Hello, world', 'text/html'))

    return transport.action(link, decoders)
      .then((res) => {
        expect(res).toEqual('Hello, world')
      })
  })

  it('should check the action function of an HTTP transport (json)', function () {
    const url = 'http://www.example.com/'
    const link = new document.Link(url, 'get')
    const transport = new transports.HTTPTransport(null, testUtils.mockedFetch('{"text": "Hello, world"}', 'application/json'))

    return transport.action(link, decoders)
      .then(res => expect(res).toEqual({text: 'Hello, world'}))
  })

  it('should check the action function of an HTTP transport (network fail)', function () {
    const url = 'http://www.example.com/'
    const link = new document.Link(url, 'get')
    const transport = new transports.HTTPTransport(null, testUtils.mockedFetch('ERROR', 'text/html', 500))

    expect(transport.action(link, decoders).then(() => {}).catch(() => {})).toThrow()
  })

  it('should check the action function of an HTTP transport (json) with query params', function () {
    const url = 'http://www.example.com/'
    const fields = [new document.Field('page', false, 'query')]
    const link = new document.Link(url, 'get', fields)
    const transport = new transports.HTTPTransport(null, testUtils.echo)
    const params = {
      page: 23
    }

    return transport.action(link, decoders, params)
      .then((res) => {
        expect(res).toEqual({url: 'http://www.example.com/?page=23', headers: {}, method: 'GET'})
      })
  })

  it('should check the action function of an HTTP transport (json) with path params', function () {
    const url = 'http://www.example.com/{user}/'
    const fields = [new document.Field('user', true, 'path')]
    const link = new document.Link(url, 'get', fields)
    const transport = new transports.HTTPTransport(null, testUtils.echo)
    const params = {
      user: 23
    }

    return transport.action(link, decoders, params)
      .then((res) => {
        expect(res).toEqual({url: 'http://www.example.com/23/', headers: {}, method: 'GET'})
      })
  })

  it('should check the action function of an HTTP transport (json) with post request', function () {
    const url = 'http://www.example.com/'
    const link = new document.Link(url, 'post')
    const transport = new transports.HTTPTransport(null, testUtils.echo)

    return transport.action(link, decoders)
      .then((res) => {
        expect(res).toEqual({url: 'http://www.example.com/', headers: {}, method: 'POST'})
      })
  })

  it('CSRF should be included with POST requests.', function () {
    const url = 'http://www.example.com/'
    const link = new document.Link(url, 'post')
    const csrf = {'X-CSRFToken': 'abc'}
    const transport = new transports.HTTPTransport(csrf, testUtils.echo)

    return transport.action(link, decoders)
      .then((res) => {
        expect(res).toEqual({url: 'http://www.example.com/', headers: {'X-CSRFToken': 'abc'}, method: 'POST'})
      })
  })

  it('CSRF should not be included with GET requests.', function () {
    const url = 'http://www.example.com/'
    const link = new document.Link(url, 'get')
    const csrf = {'X-CSRFToken': 'abc'}
    const transport = new transports.HTTPTransport(csrf, testUtils.echo)

    return transport.action(link, decoders)
      .then((res) => {
        expect(res).toEqual({url: 'http://www.example.com/', headers: {}, method: 'GET'})
      })
  })

  it('should check the action function of an HTTP transport (json) with post request and form parameters', function () {
    const url = 'http://www.example.com/'
    const fields = [new document.Field('hello', true, 'form')]
    const link = new document.Link(url, 'post', fields)
    const transport = new transports.HTTPTransport(null, testUtils.echo)
    const params = {
      hello: 'world'
    }

    return transport.action(link, decoders, params)
      .then((res) => {
        expect(res).toEqual({url: 'http://www.example.com/', method: 'POST', headers: {'Content-Type': 'application/json'}, body: {hello: 'world'}})
      })
  })

  it('should check the action function of an HTTP transport (json) with post request and a body parameter', function () {
    const url = 'http://www.example.com/'
    const fields = [new document.Field('hello', true, 'body')]
    const link = new document.Link(url, 'post', fields)
    const transport = new transports.HTTPTransport(null, testUtils.echo)
    const params = {
      hello: 'world'
    }

    return transport.action(link, decoders, params)
      .then((res) => {
        expect(res).toEqual({url: 'http://www.example.com/', method: 'POST', headers: {'Content-Type': 'application/json'}, body: 'world'})
      })
  })

  it('should check the action function of an HTTP transport (json) with missing optional query params', function () {
    const url = 'http://www.example.com/'
    const fields = [new document.Field('page', false, 'query')]
    const link = new document.Link(url, 'get', fields)
    const transport = new transports.HTTPTransport(null, testUtils.echo)
    const params = {}

    return transport.action(link, decoders, params)
      .then((res) => {
        expect(res).toEqual({url: 'http://www.example.com/', headers: {}, method: 'GET'})
      })
  })

  it('should check the action function of an HTTP transport (json) with missing required parameter', function () {
    const url = 'http://www.example.com/{user}/'
    const fields = [new document.Field('user', true, 'path')]
    const link = new document.Link(url, 'get', fields)
    const transport = new transports.HTTPTransport(null, testUtils.echo)
    const params = {}

    const callTransport = () => transport.action(link, decoders, params)
    expect(callTransport).toThrowError(new errors.ParameterError('Missing required field: "user"'))
  })

  it('should check the action function of an HTTP transport (json) with unknown paramater', function () {
    const url = 'http://www.example.com/'
    const link = new document.Link(url, 'get')
    const transport = new transports.HTTPTransport(null, testUtils.echo)
    const params = {
      hello: 'world'
    }

    const callTransport = () => transport.action(link, decoders, params)
    expect(callTransport).toThrowError(new errors.ParameterError('Unknown parameter: "hello"'))
  })
})
