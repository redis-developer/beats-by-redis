var transactionsOverview = new Vue({
  el: '#transactionstable',
  data: {
    items: [],
    received_messages: [],
    connected: false,
    account: 'bar',
    balance: '',
    question: '',
    searchitems: [],
    areaOptions : {
      series: [],
      xaxis: {
        type: "datetime",
      },
      yaxis: {
        decimalsInFloat: 2
      },
      chart: {
        height: 200,
        type: "area",
      },
      dataLabels: {
        enabled: true,
      },
      stroke: {
        curve: "smooth",
      },
      noData: {
        text: 'Loading...'
      }
    },
    areaChart: '',
    pieOptions : {
      series: [],
      chart: {
        height: 200,
        type: 'donut',
        options: {
          chart: {
            id: "chart-id"
          }
        }
      },
      labels: [],
      responsive: [{
        breakpoint: 480,
        options: {
          chart: {
            width: 200,
            id: "chart-id"
          },
          legend: {
            position: 'bottom'
          }
        }
      }]
      ,
      noData: {
        text: 'Loading...'
      }
    },
    piechart:''
  },
  mounted() {
    this.areaChart = new ApexCharts(document.querySelector("#area"), this.areaOptions);
    this.areaChart.render()
    this.pieChart = new ApexCharts(document.querySelector("#chart"), this.pieOptions);
    this.pieChart.render()
    this.getInitialData()
    this.connect()
  },
  watch: {
    // whenever question changes, this function will run
    question: function (newQuestion, oldQuestion) {
      this.searchitems = []
      this.debouncedGetAnswer()
    }
  },
  created: function () {
    this.debouncedGetAnswer = _.debounce(this.getAnswer, 100)
  },
  methods: {
    getInitialData: function () {
      var transactionsUrl = 'transaction/transactions'
      var vm = this
      axios.get(transactionsUrl)
        .then(function (response) {
          console.log(response.data)
          vm.items = response.data
          vm.balance = response.data[0].balance
        })
        .catch(function (error) {
          console.log('Error! Could not reach the API. ' + error)
        })

        axios.get("/transaction/balance")
        .then(function (response) {
          vm.areaChart.updateSeries([{
            name: 'value',
            data: response.data
          }])
        })
        .catch(function (error) {
          console.log('Error! Could not reach the API. ' + error)
        })

      axios.get("/transaction/biggestspenders")
        .then(function (response) {

          vm.pieOptions.series = response.data.series
          vm.pieOptions.labels = response.data.labels

          vm.pieChart.destroy()
          vm.pieChart = new ApexCharts(document.querySelector("#chart"), vm.pieOptions);
          vm.pieChart.render()

        })
        .catch(function (error) {
          console.log('Error! Could not reach the API. ' + error)
        })
    },
    connect: function () {
      
      var vm = this
      var wsConfigUrl = '/api/config/ws'
      axios.get(wsConfigUrl)
        .then(function (response) {

          var wsConfig = response.data
          var url = `${wsConfig.protocol}://${wsConfig.host}:${wsConfig.port}${wsConfig.endpoint}`

          var ws= new WebSocket(url)
          ws.onopen = event => {
            ws.onmessage =  event => {
              let transactionObject = JSON.parse(event.data)
              vm.items.unshift(transactionObject)

              if(vm.items.length > 10){
                vm.items.pop()
              }
              console.log(transactionObject)
              vm.account = transactionObject.toAccount
              vm.balance = parseInt(transactionObject.balance)

              axios.get("/transaction/balance")
                  .then(function (response) {
                    vm.areaChart.updateSeries([{
                      name: 'value',
                      data: response.data
                    }])
                  })
                  .catch(function (error) {
                    console.log('Error! Could not reach the API. ' + error)
                  })
              axios.get("/transaction/biggestspenders")
                  .then(function (response) {
                
                    vm.pieOptions.series = response.data.series
                    vm.pieOptions.labels = response.data.labels
                
                    vm.pieChart.destroy()
                    vm.pieChart = new ApexCharts(document.querySelector("#chart"), vm.pieOptions);                
                    vm.pieChart.render()
                
                  })
                  .catch(function (error) {
                    console.log('Error! Could not reach the API. ' + error)
                  })
            }
          }
        })

      },
    getAnswer: function () {

      var searchTerm = this.question
      if (this.question.length > 0) {
        searchTerm = searchTerm.trim() + '*'
      }

      var searchUrl = '/transaction/search?term=' + searchTerm
      var vm = this
      axios.get(searchUrl)
        .then(function (response) {
          vm.searchitems = response.data
        })
        .catch(function (error) {
          console.log('Error! Could not reach the API. ' + error)
        })
    }

  }
})