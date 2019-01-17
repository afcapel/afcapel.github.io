# The brain is the bottleneck

What I want to say:

### Programming is a game of trade offs. It's better to optimise for lower cognitive load, since the brain is the bottleneck.

Programming is a game of trade offs. In programming there are no definite rules that apply 100% of the time, but there are some guidelines that are valuable most of the time. One of those guidelines is that you should optimise your code to be simple and easy to understand, because most of the time the brain is the biggest bottleneck.

## Example: Greenfield projects projects vs legacy projects.

A clear example of how the brain is the bottleneck is legacy code. When you work on a legacy project your progress is slower than when you work on a greenfield project. Why is that? Because to make changes in greenfield project you need little context, while to make changes in legacy code you must first understand the intricacies of the existing code. For example, in a web application you may have to figure out if changing a class in the login code would also affect login in the mobile app. Understanding how login works in the web and mobile apps will take some time and mental effort. In a greenfield project you may start implementing a login page without the need of that context so development goes faster.

## What is good design: minimises the context you need to make a change.

[ Omit discussion about good design? ]
Good design simplifies making changes to existing code by limiting the amount of context you have to hold in your brain.    If to change a class you need to understand 12 other classes that use it, you will find very difficult to hold all that information in your brain and make the change. Good design hides that complexity providing clear interfaces. This complexity hiding is what we call encapsulation. To make a change in a well encapsulated code you only need to understand the exposed API, the contract between the client code and the implementation that exposes the API. You don't have to understand how the client code works or the details of the implementation. That makes the easier for your brain to hold the necessary information and be able to reason about it.

But even when the design is good, encapsulation is never perfect. Encapsulation and abstractions leak, and and often you have to worry about how an API is implemented.

[ DELETE?
* Clarity and simplicity only matter if the code is going to change.


Encapsulation and good design only matter for code that needs to change. The computer doesn't care if your code is clear and simple.
]


# Working memory and cognitive load

One reason why you should optimise for simplicity is that computer power can scale horizontally (buying more computers) or vertically (buying more powerful computers). On the other hand, your brain capacity is mostly fixed and very limited.

Psychologist have been studying for years the limitations of your brain and the results are disheartening. Your brain can only make make logical reasoning about concepts that it has in the **working memory**.

* Chunking.

* Cognitive load: what is it.

* Different types of cognitive load

* Example: Trading speed for cognitive load: test induced design damage.

* Final advice: start optimising for lower cognitive load.




<-- DELETE If you've been programming for a while you already know the right answer to any programming question: "it depends". Do you need to optimise for performance, low memory, a very dynamic UI or for programmer happiness. Well, it depends. Different situations require different solutions. And to be a good engineer you need to be aware of what are your options and the trade offs that each one involves.

But if there are no rules that can be applied all the time, there are some that can be applied most of the time. The one I find most useful, more than any programming like the Single Responsibility Principle, is that in programming my brain is usually the bottleneck. If I can not finish a task faster is not because I can't type fast enough or because my tests or my compiler take too much time to run, it's because my brain needs some good time to understand a problem and come up with a good solution to it.

Programmers love productivity hacks. This editor key binding or that alias shell that can save you a few keystrokes. All those are neat and clever, but at the end of the day I don't think they amount to much difference to productivity programming because they don't help with the thing that really slows you down programming: the limited capacity of your brain.

DELETE

Have you ever started programming a greenfield project? The feeling is exhilarating, you can develop features very fast and everything is still clean and easily comprehensible. But fast forward a few months and as soon as the projects becomes larger and more complicated, what used to be easy is now more complicated and tasks seem to take longer and longer to finish. Why does this always happen?

When a project starts there's little context that you need to keep in your mind to make any changes. You need to understand the technologies, the frameworks and programming languages that you are going to need, but not much else.

But as the project grows, it starts to accumulate features. Your change could have unforeseen ripple effects that could break any of those features. To ensure you don't break anything first you have to load in your brain all the parts in the program that can be affected by the change, understand all those parts, and only then you can make the change.

https://devrant.com/rants/55338/never-interrupt-a-programmer

It's this loading the code, from the source to your brain what takes most of your time programming. You can expand computer power vertically or horizontally, it's easy and relatively cheap. But your brain capacity is mostly fixed and there's only so much that you can do with it. So you better use it wisely.

[ Talk about Cognitive Load https://en.wikipedia.org/wiki/Cognitive_load ? ]

There are a few things you can do to optimise this bottleneck.

If the program is well designed, different parts of the code will be reasonably isolated. You can change class without needing to understand the other dozens of classes that use it. Or the hundreds of classes that are a transitive consumer of your class.

In a good program everything is well organised. There are simple conventions, that let you find the code that is responsible for a feature, and it's easy to understand.

Each abstraction, new concept or idea that is introduced in the code base has a cognitive cost. So they need to simplify the code that uses them enough to pay off this cost and lower the overall complexity of the code. If I introduce an abstraction that removes a bit of duplication but it takes another programmer more effort to understand the abstraction that to understand the duplicated code, I have not make a very good job.

In some specific problems there might be other bottlenecks at play and the trade offs might be different. For instance, in a High Frequency Trading system it can make sense to go great lengths to improve the performance of a transaction a few microseconds, even if that entails to complicate the system considerably.

But even in those cases, it pays off to start from simplicity and only give up to complexity when there's no other option. In 1975 John Gall observed what has since become known as Gall's Law:

Here’s Gall’s Law: all complex systems that work evolved from simpler systems that worked. Complex systems are full of variables and Interdependencies that must be arranged just right in order to function. Complex systems designed from scratch will never work in the real world, since they haven’t been subject to environmental selection forces while being designed.

https://personalmba.com/galls-law/
