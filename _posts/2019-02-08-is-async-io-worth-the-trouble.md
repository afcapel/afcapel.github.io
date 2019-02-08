---
layout: post
title:  "Is async I/O worth the trouble?"
author: alberto
categories: articles
image: assets/images/telephone.jpg
featured: true
hidden: false
---

A few years ago node.js popularised asynchronous I/O to write server side web applications.
Since then I often hear that asynchronous web applications
are faster and more scalable. And that is true some times, but I don't think that is the whole story and I want to take a closer look at the tradeoffs, its benefits and its cost, and if async I/O is always a good idea.

In this article I'm assuming you're familiar with how asynchronous and synchronous I/O
work. If you're not, you can read the standard [node documentation about the subject](https://nodejs.org/en/docs/guides/blocking-vs-non-blocking/). It includes the usual rationale about why async I/O is faster.

## Async vs sync in practice

Let's compare the performance of a simple HTTP server using async and sync APIs.

### Asynchronous HTTP server

```js
const http = require('http')
const fs   = require('fs')

const nBytes = 1024 * 1024
const port = 3000

const server = http.createServer((request, response) => {

  fs.open('/dev/urandom', 'r', (err, fd) => {
    if (err) {
      return console.log('something bad happened', err)
      process.exit(1)
    }

    const buffer = Buffer.allocUnsafe(nBytes)

    fs.read(fd, buffer, 0, nBytes, null, (err, bytesRead, buffer) => {
      if (err) {
        return console.log('something bad happened', err)
        process.exit(1)
      }

      const data = buffer.toString("utf8", 0, nBytes)
      response.writeHead(200, {'Content-Type': 'text/plain'})
      response.end(data)
    })
  })

}).listen(port, (err) => {
  if (err) {
    return console.log('something bad happened', err)
    process.exit(1)
  }

  console.log(`server is listening on ${port}`)
})
```

The code is straightforward: when the server receives a request it reads some bytes from `/dev/urandom` and packages them in an HTTP response.

I'm reading 1MB from `/dev/urandom` to simulate some kind of I/O during a request, like accessing a database. 1MB may seem too much, but that will emphasise the effects of I/O and given the [recent website obesity crisis](https://www.youtube.com/watch?v=iYpl0QVCr6U) it's actually a fairly standard weight for a web page these days.

To test the performance of this code I've used [the excellent apache benchmark tool](https://httpd.apache.org/docs/2.4/programs/ab.html). I made 100 requests, with a maximum concurrency of 50 and measured the response time.

```
$ ab -l -r -n 100 -c 50 -k http://localhost:3000/ This is ApacheBench, Version 2.3 <$Revision: 1807734 $> Copyright 1996 Adam Twiss, Zeus Technology Ltd, http://www.zeustech.net/ Licensed to The Apache Software Foundation, http://www.apache.org/

Benchmarking localhost (be patient).....done

Server Software: Server Hostname: localhost Server Port: 3000

Document Path: / Document Length: Variable

Concurrency Level: 50
Time taken for tests: 10.519 seconds
Complete requests: 100
Failed requests: 0
Keep-Alive requests: 0
Total transferred: 190117975 bytes
HTML transferred: 190107875 bytes
Requests per second: 9.51 [#/sec] (mean)
Time per request: 5259.484 [ms] (mean)
Time per request: 105.190 [ms] (mean, across all concurrent requests)
Transfer rate: 17650.22 [Kbytes/sec] received
```

As you can see, **it takes ~10.5 seconds** to complete.

### Synchronous HTTP server

```js
const http = require('http')
const fs   = require('fs')

const nBytes = 1024 * 1024
const port = 3001

const server = http.createServer((request, response) => {
  const fd = fs.openSync('/dev/urandom', 'r')
  const buffer = Buffer.allocUnsafe(nBytes)

  fs.readSync(fd, buffer, null, nBytes)
  const data = buffer.toString("utf8", 0, nBytes)

  response.writeHead(200, {'Content-Type': 'text/plain'})
  response.end(data)

}).listen(port, (err) => {
  if (err) {
    return console.log('something bad happened', err)
  }

  console.log(`server is listening on ${port}`)
})
```

Something to note in the sync version: there's less nesting in this code, which makes it easier to follow. In the async version, every I/O operation is handled by a callback that must check if the operation succeeded or not. That adds conditional logic, nesting, and makes the whole flow more convoluted. It might not seem a very big deal in a small program, but it can become unwieldy pretty soon in a bigger system in which you need to execute one I/O operation after another.

Callbacks can add so much complexity that they often lead to a [callback hell](http://callbackhell.com/).

So, the synchronous code looks simpler, but how does it perform? Let's measure it:

```
$ ab -l -r -n 100 -c 50 -k http://localhost:3001/

Benchmarking localhost (be patient).....done

Concurrency Level: 50
Time taken for tests: 14.188 seconds
Complete requests: 100
Failed requests: 0
Keep-Alive requests: 0
Total transferred: 190095618 bytes
HTML transferred: 190085518 bytes
Requests per second: 7.05 [#/sec] (mean)
Time per request: 7094.051 [ms] (mean)
Time per request: 141.881 [ms] (mean, across all concurrent requests)
Transfer rate: 13084.22 [Kbytes/sec] received
```

**The sync version takes ~ 14.2 seconds, or 35% slower**, hence your usual claim that sync APIs are slower.

### Clustered multiprocess HTTP server

So far async I/O seems a reasonable tradeoff to make: you pay some increased complexity but you get a faster system.

However, that sync example is somewhat contrived and doesn't represent how you would run a sync application in production. Every framework or language doing synchronous I/O already knows that the program execution will be halted during I/O and it's prepared to deal with it. Application servers usually run in a multi process or multi thread mode. In a multi process mode you have a pool of processes, each waiting for a request. When a process is blocked doing sync I/O the operating system schedules another one that it's free so you can serve multiple requests concurrently.

With sync I/O you don't have to worry about concurrency: the operating system already handles concurrency for you. And operating systems are very efficient at running multiple processes concurrently and ensuring they are isolated from each other.

The multi thread mode is similar, but instead of a pool of processes, you have a pool of threads. A thread requires less memory than a process, but it also gives you less guarantees in terms of isolation, so there's also a tradeoff here between simplicity and efficiency.

Let's see how a clustered solution would look like:

```js
const cluster = require('cluster')
const http = require('http')
const fs   = require('fs')

const nBytes = 1024 * 1024
const nProcesses = 10

if (cluster.isMaster) {
  masterProcess()
} else {
  childProcess()
}

function masterProcess() {
  console.log(`Master ${process.pid} is running`)

  for (let i = 0; i < nProcesses; i++) {
    console.log(`Forking process number ${i}...`)
    cluster.fork()
  }
}

function childProcess() {
  console.log(`Worker ${process.pid} started...`)

  http.createServer((request, response) => {
    const fd = fs.openSync('/dev/urandom', 'r')
    const buffer = Buffer.allocUnsafe(nBytes)

    fs.readSync(fd, buffer, null, nBytes)
    const data = buffer.toString("utf8", 0, nBytes)

    response.writeHead(200, {'Content-Type': 'text/plain'})
    response.end(data)
  }).listen(3002)
}
```

This example is similar to the sync one, but instead of only one process I've created 10.

Clustering is a good practice even if you are only using async APIs. Nodejs is a single threaded environment, so in order to take full advantage of all the cores in your server you need to use some kind of clustering. That's why the cluster module is in the Nodejs standard library.

We are not adding much complexity here: clustering is something you  need to do anyway, whether you are using sync or async APIs.

Now let's see how the cluster performs, compared to the previous versions:

```
$ ab -l -r -n 100 -c 50 -k http://localhost:3002/

Benchmarking localhost (be patient).....done

Concurrency Level: 50
Time taken for tests: 10.331 seconds
Complete requests: 100
Failed requests: 0
Keep-Alive requests: 0
Total transferred: 190082895 bytes
HTML transferred: 190072795 bytes
Requests per second: 9.68 [#/sec] (mean)
Time per request: 5165.651 [ms] (mean)
Time per request: 103.313 [ms] (mean, across all concurrent requests)
Transfer rate: 17967.52 [Kbytes/sec] received
```

That's approximately **the same performance than the async version**! What's happening here?

## Modern CPUs are very fast at context switching

Modern CPUs and Operating Systems are very efficient doing context switches. A benchmark from 2010 estimated that a context switch takes between [2 and 50 **micro** seconds](https://blog.tsunanet.net/2010/11/how-long-does-it-take-to-make-context.html). I can only assume CPUs have improved since then, but it doesn't really matter either. A few microseconds per context switch means a HTTP request can be stopped dozens of times and **the overhead is likely to take less than 1ms in modern hardware, which will be hardly noticeable in most web applications**.

**Async I/O adds complexity to the execution flow of a program and is not noticeably faster than sync I/O in a multi threaded or multi process environment**.

## Some common objections to synchronous APIs

#### Multiple processes will take much more memory

This might be true for multiprocess servers, but memory is cheap and it’s rarely the main bottleneck. I’d argue that [your brain is more likely to be the bottleneck](https://afcapel.com/articles/2019/01/18/cognitive-load-in-programming.html), so anything that you to do decrease complexity will be more valuable that saving RAM.

#### Threads are complicated

This is true for general programs, but it doesn’t apply well to web applications. In a web application you have a very simple isolation scheme: each request is executed within a thread. Different requests shouldn’t share information and so different threads don’t need to share information either.

#### Slow clients

You might have an application, for example a chat, in which clients are idle most of the time
and they only interact with the server sporadically. It seems a waste of resources to keep a process or thread blocked all the time waiting for the odd interaction. That's true, but in those cases you can [offload the connection management and message parsing to an async application
server](https://evilmartians.com/chronicles/anycable-actioncable-on-steroids) and handle the responses in your application with synchronous code.

#### So... should I use sync I/O in node?

No! The whole nodejs ecosystem assumes that all your code will be asynchronous. Mixing
synchronous and asynchronous code will lead to terrible results. If you are stuck with node,
follow the beaten path and write async code. However, if you have the opportunity try to consider
other sync environments for you next project.

Async I/O is also a superior approach in other environments that are not web applications,
like GUIs, or client side code where multiple processes are not an option.

#### But async!

Lastly, some people will argue that async I/O is no longer problematic since ES7 introduced `async` and `await`.  `async` and `await` are new keywords to handle asynchronous operations in a synchronous-like way. For instance, you can transform this code:

```js
const firstFunction = () => callback(null, "Hello")
const secondFunction = (first, callback) => callback(null, first + " world")

const withCallbacks = (callback) => {
  firstFunction((err, firstResult) => {
    if (err) {
      return console.log('something bad happened', err)
      process.exit(1)
    }

    secondFunction(firstResult, (err, result) => {
      if (err) {
        return console.log('something bad happened', err)
        process.exit(1)
      }

      callback(null, result)
    })
  })
}
```

Into something like:

```js
const firstFunction = () =>  Promise.resolve("Hello")
const secondFunction = (first) => Promise.resolve(first + " world")

const withAsync = async () => {
  const firstResult  = await firstFunction()
  const secondResult = await secondFunction(firstResult)

  return secondResult
}
```

This is clearly an improvement, but it's still more complicated than it should be.

`async` and `await` are wrappers on top of the `Promise` interface, and `Promise` is
another wrapper around asynchronous calls. You still need to understand all those modes of
operation. What's worse, we can mix the three, making the code inconsistent.

Also, in the example, `secondFunction` doesn't execute until `firstFunction` is finished.
**We have removed the concurrent execution that was the reason to prefer async programming
in the first place**. In a way, we have implemented sync semantics (and performance) adding layers of abstraction on top of the overcomplicated async API. But as we saw, the performance difference was not really significant to begin with. After all this long journey, wouldn't have been easier to follow synchronous programming from the beginning?
