---
layout: post
title: "How to neatly organise assets in a Rails app"
author: alberto
categories: articles
image: assets/images/shelf.jpg
featured: true
hidden: true
---

One of the great things about Rails is that it comes packed with a lot of useful
conventions. I can open open a new Rails application and I immediately know where the
controllers are and how they are mapped to their views. On the other hand, Rails
doesn't provide much of a guideline about how you should organise your assets. This
is probably a cultural issue: rails developers are usually more proficient
with backend programming than with css or javascript. But there's also a natural
relationship between assets and views. We can leverage this relationship to map assets
to views, in the same way that views are mapped to controllers.

First things first, let's clarify what we want to achieve: **we want to make dead easy to understand which assets assets are used in any part of the app**. The mapping should also work the other way around: given a css or js file, it should be obvious where in the app is used.
How can we achieve that?

Let's say we have a typical rails controller dir:

```
app/controllers
├── admin
│   ├── base_controller.rb
│   ├── dashboard_controller.rb
│   ├── ... other admin controllers
├── api
│   ├── base_controller.rb
│   └── ... other api controllers
├── application_controller.rb
├── authenticated
│   ├── onboarding
│   │   ├── base_controller.rb
│   │   └── ... other onboarding controllers
│   ├── settings
│   │   ├── accounts_controller.rb
│   │   └── ... other settings controllers
│   ├── base_controller.rb
│   ├── .. other authenticated controllers
└── public
    ├── base_controller.rb
    └──  ... other public controllers
```

This is all standard rails with some fairly typical namespacing. At the top level we have
a few namespaces for the main areas of the app: `admin`, `api`, `authenticated`,
and `public`. **Each one of these main areas have its own base controller and a
specific layout**. The `authenticated` namespace is for pages that can only be seen
by authenticated users and it's the bulk of the app. Because it's so big, it has a few subnamespaces for it's thematic subareas: `settings` for all the settings controllers, `onboarding` for all the controllers dealing with user onboarding.

Following rails conventions, the views associated with these controller have the
same directory structure:

```
app/views
├── admin
│   ├── dashboard
│   │   └── show.html.erb
│   ├── ... other admin views
├── api
│   └── ... api jbuilder views
├── authenticated
│   ├── ... authenticated views
│   ├── onboarding
│   │   ├── ... onboarding views
│   ├── settings
│   │   ├── ... settings views
├── layouts
│   ├── admin.html.erb
│   ├── application.html.erb
│   ├── mailer.html.erb
│   └── public.html.erb
├── public
│   └── ... public views
└── shared <- These are partials shared by different controllers
   ├── _error_messages.html.erb
   ├── _flash.html.erb
   └── .. other shared partials
```

So we have views mapped by convention to controllers, and that makes it very easy
to know which view is used for each controller and what controllers is associated with a view.
**The next natural step is to use the same mapping from vies to stylesheets**. My stylesheet
dir looks like this:

```
app/assets/stylesheets
├── admin
│   ├── _dashboard.scss <- styles used by all admin/dashboard actions
│   │   └── _show.scss  <- styles used by the admin/dashboard#show action
│   └── shared <- These are partials that are shared by all admin views
│       ├── _layout.scss <- styles for the admin layout
│       ├── _navbar.scss <- Other partials used in
│       └── _sidebar.scss
├── admin.scss
├── authenticated
│   ├── _layout.scss
│   ├── _onboarging.scss  <- These are partials that are shared by all onboarding views
│   ├── settings <- These are partials that are shared by all settings views
│   │   └── subscriptions
│   │       └── _show.scss <- Styles only used in settings/subscriptions/show
│   └── shared <- Common components. These are partials that are shared by all views
│       ├── _card.scss
│       ├── ... other components
│       ├── _spinner.scss
│       └── _thumbs.scss
├── authenticated.scss <- main css for the authenticated layout
├── public
│   ├── _layout.scss
│   └── shared  <- These are partials that are shared by public views
│       └── ... components only used in the public layout
├── public.scss <- main css for the public layout
└── shared <- css shared by all layouts
    ├── _functions.scss
    ├── _mixins.scss
    ├── _variables.scss
    ├── pills.scss
    └── ... other global components
```

The directory structure follows the same layout than views and controllers. **The main
rule is to always nest the file name to the most specific folder possible**. For instance:

- If some styles are only needed in `app/views/admin/dashboard/show.html.erb` they will
  go in `app/assets/stylesheets/admin/dashboard/_show.scss`.

- If they are shared between actions in the `admin/dashboard_controller`, they would go
  in `app/assets/stylesheets/admin/dashboard.scss`

- If they are shared by different admin controllers, they go in
  `app/assets/stylesheets/admin/shared/name_of_the_component.scss`

- If they are shared by controllers with different layouts, they go in
  `app/assets/stylesheets/shared/name_of_the_component.scss`

The top level stylesheets just include the folders they need. For instance,
`app/assets/stylesheets/admin.scss` is just:

```css
@import "shared/**/*";
@import "admin/**/*";
```

These days I mostly use [stimulus](https://stimulusjs.org/) for the front end. Stimulus
already comes with sensible file naming convention. But if you still have a lot of
js sprinkles in your app, you can use the same convention to organise `app/assets/javascripts`.
In this way you only need one criteria to organise most of the code in your application:
from controllers, to views, including css and javascript.
