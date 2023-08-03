
var chartColors = {
    red: 'rgb(255, 99, 132)',
    orange: 'rgb(255, 159, 64)',
    yellow: 'rgb(255, 205, 86)',
    green: 'rgb(75, 192, 192)',
    info: '#41B1F9',
    blue: '#3245D1',
    purple: 'rgb(153, 102, 255)',
    grey: '#EBEFF6'
};

var ctxBar = document.getElementById("bar").getContext("2d");
new Chart(ctxBar, {
    type: 'bar',
    data: {
        labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul"],
        datasets: [{
            label: 'Students',
            backgroundColor: [chartColors.grey, chartColors.grey, chartColors.grey, chartColors.grey, chartColors.info, chartColors.blue, chartColors.grey],
            data: [
                5,
                10,
                30,
                40,
                35,
                55,
                15,
            ]
        }]
    },
    options: {
        responsive: true,
        barRoundness: 1,
        title: {
            display: true,
            text: "Students in 2020"
        },
        legend: {
            display: false
        },
        scales: {
            yAxes: [{
                ticks: {
                    beginAtZero: true,
                    suggestedMax: 40 + 20,
                    padding: 10,
                },
                gridLines: {
                    drawBorder: false,
                }
            }],
            xAxes: [{
                gridLines: {
                    display: false,
                    drawBorder: false
                }
            }]
        }
    }
});
var line = document.getElementById("line").getContext("2d");
var gradient = line.createLinearGradient(0, 0, 0, 400);
gradient.addColorStop(0, 'rgba(50, 69, 209,1)');
gradient.addColorStop(1, 'rgba(265, 177, 249,0)');

var gradient2 = line.createLinearGradient(0, 0, 0, 400);
gradient2.addColorStop(0, 'rgba(255, 91, 92,1)');
gradient2.addColorStop(1, 'rgba(265, 177, 249,0)');

new Chart(line, {
    type: 'line',
    data: {
        labels: ['16-07-2018', '17-07-2018', '18-07-2018', '19-07-2018', '20-07-2018', '21-07-2018', '22-07-2018', '23-07-2018', '24-07-2018', '25-07-2018'],
        datasets: [{
            label: 'Balance',
            data: [50, 25, 61, 50, 72, 52, 60, 41, 30, 45],
            backgroundColor: "rgba(50, 69, 209,.6)",
            borderWidth: 3,
            borderColor: 'rgba(63,82,227,1)',
            pointBorderWidth: 0,
            pointBorderColor: 'transparent',
            pointRadius: 3,
            pointBackgroundColor: 'transparent',
            pointHoverBackgroundColor: 'rgba(63,82,227,1)',
        }, {
            label: 'Balance',
            data: [20, 35, 45, 75, 37, 86, 45, 65, 25, 53],
            backgroundColor: "rgba(253, 183, 90,.6)",
            borderWidth: 3,
                borderColor: 'rgba(253, 183, 90,.6)',
            pointBorderWidth: 0,
            pointBorderColor: 'transparent',
            pointRadius: 3,
            pointBackgroundColor: 'transparent',
            pointHoverBackgroundColor: 'rgba(63,82,227,1)',
        }]
    },
    options: {
        responsive: true,
        layout: {
            padding: {
                top: 10,
            },
        },
        tooltips: {
            intersect: false,
            titleFontFamily: 'Helvetica',
            titleMarginBottom: 10,
            xPadding: 10,
            yPadding: 10,
            cornerRadius: 3,
        },
        legend: {
            display: true,
        },
        scales: {
            yAxes: [
                {
                    gridLines: {
                        display: true,
                        drawBorder: true,
                    },
                    ticks: {
                        display: true,
                    },
                },
            ],
            xAxes: [
                {
                    gridLines: {
                        drawBorder: false,
                        display: false,
                    },
                    ticks: {
                        display: false,
                    },
                },
            ],
        },
    }
});
