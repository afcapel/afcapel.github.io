---
layout: post
title:  "A minimalistic foundation for a Rails REST API"
author: alberto
categories: articles
image: assets/images/blueprint.jpg
featured: true
hidden: false
---

While working on [Gazpacho](https://www.gazpachoapp.com) I came to a point where
I started to think it would be nice to have an API. Over the years I've worked
with big Rails applications in which the base api controller had hundreds of lines of
code and used dozens of auxiliary classes. But in my case requirements are very simple: I'm in control of all the clients that will consume the API, so I don't need any sophisticated authentication mechanism and I can live with bare bone error messages without worrying about leaking too much information. This is close to the simplest case you can find
and I started to wonder what is the bare minimum I would need to build a simple REST API (I don't
need the added complexity of a GraphQL API, thank you very much). After finishing the API I was so pleased
with the result I thought I'd share it in case someone else find it useful.

The base controller is only ~ 40LOC (19 SLOC):

```ruby
# frozen_string_literal: true

module Api
  class BaseController < ActionController::Base
    include Api::Authentication

    RECORDS_PER_PAGE = 25

    skip_before_action :verify_authenticity_token

    rescue_from ActiveRecord::RecordInvalid, ActiveRecord::RecordNotDestroyed do |exception|
      render_validation_errors(exception.record)
    end

    private

    def render_validation_errors(record)
      render json: record.errors.as_json, status: :unprocessable_entity
    end

    # Follows RFC5988 convention https://tools.ietf.org/html/rRFC5988
    def paginate(resources)
      resources = resources.page(params[:page]).per(RECORDS_PER_PAGE)

      unless resources.first_page?
        response.set_header("Link",
          "<#{url_for(page: resources.prev_page)}>; rel=\"previous\"")
      end

      unless resources.last_page?
        response.set_header("Link",
          "<#{url_for(page: resources.next_page)}>; rel=\"next\"")
      end

      response.set_header("X-Total-Count", resources.total_count)

      resources
    end
  end
end
```

It handles pagination and error rendering. For pagination I'm using [Kaminari](https://github.com/kaminari/kaminari) and including the pagination info in `Link` headers,
following the [RFC5988 specification](https://tools.ietf.org/html/rfc5988).

There's also a minimal module to implement token authentication (the api is behind https):

```ruby
module Api
  module Authentication
    extend ActiveSupport::Concern

    included do
      before_action :authenticate
    end

    private

    def authenticate
      authenticate_or_request_with_http_token do |token, options|
        Rails.application.secrets.api_key == token
      end
    end
  end
end
```

Thanks to Rails sensible defaults, I can create very slick REST controllers just with that foundation. For instance, a typical controller would be around 40LOC and look like this:

```ruby
module Api
  class FoodsController < Api::BaseController

    before_action :load_food, only: [:show, :update, :destroy]

    def index
      @foods = paginate(Food::Search.new(params).foods)
    end

    def create
      @food = Food.create!(food_params)
      render "show"
    end

    def show
    end

    def update
      @food.update!(food_params)
    end

    def destroy
      @food.destroy!
    end

    private

    def load_food
      @food = Food.find(params[:id])
    end

    def food_params
      params.require(:food).permit(...)
    end
  end
end
```

The views are [jbuilder](https://github.com/rails/jbuilder) templates, and again quite simple.

And that's all there is to it, pretty simple, isn't it?

Of course, if I start to need more features the code will become more complicated. But I think [Gall's Law](https://personalmba.com/galls-law/) applies:

> A complex system that works is invariably found to have evolved from a simple system that worked.
>
> **John Gall, systems theorist**

If I ever build a more complex API that works, it will
be the evolution of a simple API that works.
