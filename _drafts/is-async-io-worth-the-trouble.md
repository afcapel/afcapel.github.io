---
layout: post
title:  "Is async I/O worth the trouble?"
author: alberto
categories: articles
image: assets/images/blueprint.jpg
featured: true
hidden: false
---

Since nodejs became very popular a few years async programming has been all the rage in programming circles. I often hear that async programming is better because it's faster, which may be true some times, but I don't think it tells the full story. What are exactly the benefits and costs of async I/O?

## The difference between sync and async APIs

If you're unfamiliar with the difference between sync and async let me explain them briefly. If you already know what they are, feel free to skip to the next section.

[Explanation of sync vs async apis]

## Async vs sync in practice

I've created a couple of scripts to illustrate the differences between async and sync APIs. First, the async one, which would be the standard on in node:

[ src/async_vs_sync/async.js ]

The code is fairly straightforward, when the server receives a request it reads some bytes from /dev/urandom and packages them in a HTTP response. To make it clear the effects of I/O I'm packing a 1MB response. It may be look too big, but given the recent website obesity crisis, it's actually a fairly standard weight for a web page these days.

I can test the performance of this code with the excellent apache benchmark tool (ab). I'm going to make 100 requests, with a maximum concurrency of 50, and see how long does it take for the server to complete all the requests.

''' $ ab -l -r -n 100 -c 50 -k http://localhost:3000/ This is ApacheBench, Version 2.3 <$Revision: 1807734 $> Copyright 1996 Adam Twiss, Zeus Technology Ltd, http://www.zeustech.net/ Licensed to The Apache Software Foundation, http://www.apache.org/

Benchmarking localhost (be patient).....done

Server Software: Server Hostname: localhost Server Port: 3000

Document Path: / Document Length: Variable

Concurrency Level: 50 Time taken for tests: 10.519 seconds Complete requests: 100 Failed requests: 0 Keep-Alive requests: 0 Total transferred: 190117975 bytes HTML transferred: 190107875 bytes Requests per second: 9.51 [#/sec] (mean) Time per request: 5259.484 [ms] (mean) Time per request: 105.190 [ms] (mean, across all concurrent requests) Transfer rate: 17650.22 [Kbytes/sec] received '''

As you can see, it takes ~10.5 seconds to complete.

Now, let's take a look at the sync version of the code:

[ src/async_vs_sync/sync.js ]

There's less nesting in this code, which makes it easier to follow. In the async version, the every I/O operation is handled by a callback that must check if the operation succeeded or not. That adds a conditional logic and nesting and makes the whole code harder to follow. It might not seem a very big deal, but it can become unwieldy pretty soon in a bigger system in which you need to execute one I/O operation after another. It is indeed so common that it even has a name: callback hell.

So, the synchronous code looks simpler, but how does it perform? Let's measure it:

'''shell $ ab -l -r -n 100 -c 50 -k http://localhost:3001/

Benchmarking localhost (be patient).....done

Concurrency Level: 50 Time taken for tests: 14.188 seconds Complete requests: 100 Failed requests: 0 Keep-Alive requests: 0 Total transferred: 190095618 bytes HTML transferred: 190085518 bytes Requests per second: 7.05 [#/sec] (mean) Time per request: 7094.051 [ms] (mean) Time per request: 141.881 [ms] (mean, across all concurrent requests) Transfer rate: 13084.22 [Kbytes/sec] received '''

The sync version takes ~ 14.2 seconds, or 35% slower, hence your usual claim that sync APIs are slower.

So far async I/O seems a reasonable trade off to make: you pay some increased complexity but you get a faster system. 

The problem is that the sync example is somewhat contrived and doesn't represent how you would run an async application in production. Every framework or language doing synchronous I/O already knows that the program execution will be halted during I/O and it's already prepared to deal with it. Application servers usually run in a multi process or multi thread mode. In a multi process mode you have a pool of processes, each waiting for a request. When a process is blocked doing sync I/O the operating system schedules another one that it's free so you can serve multiple requests concurrently. The nice thing about this mode is that you don't have to worry about concurrency, the operating system already handles concurrency for you. Operating systems are very good at running multiple processes concurrently and ensuring they are isolated from each other. The multi thread mode is similar, but instead of a pool of processes, you have a pool of threads. A thread requires less memory than a process, but it also gives you less guarantees in terms of isolation, so there's a also tradeoff between simplicity and efficiency here.

Ok, now let's look at a multi process example and see how it performs:

[ src/async_vs_sync/cluster.js ]

This example is similar to the async one, but instead of only one process I've created 10. This is a good practice even if you are only using async APIs. Nodejs is a single threaded environment, so if want to take full advantage of all the cores in your server you need to use some kind of clustering. That's why the cluster module is in the Nodejs standard library. So we are not adding much complexity here: clustering is something you  need to do anyway, whether you are using sync or async apis.

Now let's see how the cluster performs, compared to the previous versions:

''' $ ab -l -r -n 100 -c 50 -k http://localhost:3002/

Benchmarking localhost (be patient).....done

Concurrency Level: 50 Time taken for tests: 10.331 seconds Complete requests: 100 Failed requests: 0 Keep-Alive requests: 0 Total transferred: 190082895 bytes HTML transferred: 190072795 bytes Requests per second: 9.68 [#/sec] (mean) Time per request: 5165.651 [ms] (mean) Time per request: 103.313 [ms] (mean, across all concurrent requests) Transfer rate: 17967.52 [Kbytes/sec] received '''

That's approximately the same performance than the async version! What's happening here? The answer is easy: modern CPUs and Operating Systems are very efficient doing context switches. A benchmark from 2010 estimated that a context switch takes between 2 and 50 micro seconds, a more modern benchmark from 2017 gives between 8 and 19 microseconds. That means that even during a request a process is stopped dozens of times, that's likely to take less than 1ms in modern hardware, which will be hardly noticeable in most web applications.

In conclusion, async I/O adds a lot of complexity to the execution flow of a program and is not necessarily faster than sync I/O in a multi threaded or multi process environment.

## Some common objections to synchronous APIs

### Slow clients

### Multiple processes will take much more memory

This might be true for multiprocess servers, but memory is cheap and it’s rarely the main bottleneck. I’d argue that [your brain is more likely to be the bottleneck](LINK), so anything that you do decrease complexity will be more valuable that saving RAM.

### Threads are complicated

This is true for general programs, but it doesn’t apply well to web applications. In a web application you have very simple isolation scheme: each request is executed in a thread. Different requests shouldn’t share information and so different threads don’t need to share information either. 

### But async
