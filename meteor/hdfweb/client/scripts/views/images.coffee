###
    View logic for the Images page
###

@ViewImages = Backbone.View.extend

    # The Meteor template used by this view
    template: null

    # Called on creation
    initialize: () ->
        # Use Meteor.render to set our template reactively
        this.template = Meteor.render () ->
            html = Template.images({images: Images.find({_collectionId: id})})
            return html
    
    # Render the view on its $el paramter and return the view itself
    render: () ->
        this.$el = (this.template)
        return this
