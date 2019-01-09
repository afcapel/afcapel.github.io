document.addEventListener("turbolinks:load", function(event) {
  if ( typeof ga is "function" ) {
    ga("set", "location", event.data.url)
    ga("send", "pageview")
  }
})
