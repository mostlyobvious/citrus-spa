_.defaults this,
  LogAll: (object) ->
    for own key, value of object
      if _.isFunction(value)
        do (key) ->
          Before(object, key, -> console.log("##{key}"))

