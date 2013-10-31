window.citrus = {}
window.citrus.console = {}

require('utils')

class citrus.console.Application
  constructor: ->
    usecase    = new citrus.console.Usecase()
    gui        = new citrus.console.Gui()
    serverSide = new citrus.console.ServerSide('http://127.0.0.1:8080')
    glue       = new citrus.console.Glue(usecase, gui, serverSide)
    usecase.start()


class citrus.Build
  constructor: (@uuid, @output = "") ->


class citrus.console.Usecase
  constructor: ->

  start: =>

  setBuild: (@build) =>

  addConsoleEntry: (entry) =>
    @build.output << entry


class citrus.console.Glue
  constructor: (@usecase, @gui, @serverSide) ->
    @applyLogging()

    Before(@usecase, 'start', @loadData)
    After(@usecase, 'setBuild', @showConsole)
    After(@usecase, 'setBuild', @fetchConsole)
    After(@serverSide, 'consoleDataReceived', @addConsoleEntry)
    After(@usecase, 'addConsoleEntry', @appendConsoleEntry)

  loadData: =>
    uuid = @gui.getBuildIdFromUrl()
    @usecase.setBuild(new citrus.Build(uuid))

  showConsole: (build) =>
    @gui.showConsole(build)

  fetchConsole: (build) =>
    @serverSide.fetchConsole(build)

  addConsoleEntry: (entry) =>
    @usecase.addConsoleEntry(entry)

  appendConsoleEntry: (entry) =>
    @gui.appendConsoleEntry(entry)

  applyLogging: =>
    [@usecase, @gui, @serverSide].map((component) => LogAll(component))


class citrus.console.Gui
  constructor: ->

  getBuildIdFromUrl: =>
    $.url().param('uuid')

  showConsole: (build) =>
    $('[data-role="build-name"]').html("Build #{build.uuid}")

  appendConsoleEntry: (entry) =>
    $('[data-role="build-console"]').append(entry)

class citrus.console.InMemoryServerSide
  constructor: ->

  fetchConsole: (build) =>
    @consoleDataReceived('........')
    intervalId = setInterval(( => @consoleDataReceived('.')), 25)
    setTimeout(( =>
      clearInterval(intervalId)
      @consoleDataReceived('\n\nFinished in 0.84704 seconds\n62 examples, 0 failures\n\nRandomized with seed 15015')
    ), 1000)

  consoleDataReceived: (data) =>

class citrus.console.ServerSide
  constructor: (@apiUrl) ->

  fetchConsole: (build) =>
    eventSource = new EventSource("#{@apiUrl}/builds/#{build.uuid}/console")
    eventSource.addEventListener('message', (message) => @consoleDataReceived(message.data))

  consoleDataReceived: (data) =>


$(document).ready ->
  new citrus.console.Application()


