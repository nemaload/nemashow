###
    Main router for the project
###

@Router = Backbone.Router.extend

    routes:
        "": "home"
        "images/:id": "images"
        "images/image/:id": "images_image"
        "*path": "home" # For any other path, go home
    
    # Selector for the div that will contain each page
    page_parent_sel: "#content"

    # Actually changes the page by creating the view and inserting it
    go: (viewClass, params) ->
        if !viewClass?
            viewClass = Home

        view = new viewClass(params)
        $(this.page_parent_sel).html(view.render().$el)

    # Methods for each route
    home: () ->
        this.go Home

    images: (id) ->
        this.go ViewImages, id

    images_image: (id) ->
        this.go ViewImagesDetail, id
