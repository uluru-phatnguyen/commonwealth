import 'pages/validatorprofile.scss';
import m from 'mithril';
import { ALIGN_CENTER, ALIGN_LEFT } from 'construct-ui/lib/esm/components/icon/generated/IconNames';

export const chartColors = {
  red: 'rgb(255, 99, 132)',
  orange: 'rgb(255, 159, 64)',
  yellow: 'rgb(255, 205, 86)',
  green: 'rgb(75, 192, 192)',
  blue: 'rgb(54, 162, 235)',
  purple: 'rgb(153, 102, 255)',
  grey: 'rgb(201, 203, 207)'
};

export default {
  loaded: false,
  config: {
    type: 'line',
    data: {
      labels: [],
      datasets: [{
        label: '',
        fill: true,
        pointBackgroundColor: '#fff',
        borderColor: chartColors.red,
        pointRadius: 3, // size of points
        borderWidth: 2, // line width
        lineTension: 0,
        data:[],
        /* point options */

        pointBorderWidth: 2, // size of outer circle
      }, ]
    },
    options: {
      responsive: true,
      tooltips: {
        mode: 'point',
        intersect: true,
      },
      hover: {
        mode: 'point',
        intersect: true
      },
      legend: {
        display: false
      },
      scales: {
        xAxes: [{
          offset: true,
          display: true,
          ticks: {
            fontFamily: 'Inter',
            fontColor: '#B0BAC9',
            fontSize: 12,
            padding: 10,
            maxRotation: 0,
            minRotation: 0,
            stepSize: 500,
            min: -1,
            max: 100,
            fixedStepSize: 100,
          },
          gridLines: {
            display: false
          }
        }],
        yAxes: [{
          display: true,

          ticks: {
            fontFamily: 'Inter',
            fontColor: '#B0BAC9',
            fontSize: 12,

            suggestedMin: 0,    // minimum will be 0, unless there is a lower value.
            // OR //
            beginAtZero: true,  // minimum value will be 0.
            maxTicksLimit: 2000,
            stepSize: 500,
            padding: 1,
          },
          gridLines: {
            display: false
          }
        }]
      },
    }
  }
};

// export default {
//   loaded: true,
//   config: {
//     type: 'line',
//     data: {
//       xValues: [],
//       datasets: [{
//         label: '',
//         fill: true,
//         pointBackgroundColor: '#fff',
//         borderColor: chartColors.red,
//         pointRadius: 5, // size of points
//         borderWidth: 3, // line width
//         lineTension: 0,

//         /* point options */

//         pointBorderWidth: 3, // size of outer circle
//       }, ]
//     },
//     options: {
//       responsive: true,
//       tooltips: {
//         mode: 'point',
//         intersect: true,
//       },
//       hover: {
//         mode: 'point',
//         intersect: true
//       },
//       legend: {
//         display: false
//       },
//       scales: {
//         xAxes: [{
//           offset: true,
//           display: true,
//           ticks: {
//             fontFamily: 'Inter',
//             fontColor: '#B0BAC9',
//             fontSize: 12,
//             padding: 20,
//             maxRotation: 0,
//             minRotation: 0,
//             stepSize: 500,
//           },
//           gridLines: {
//             display: false
//           }
//         }],
//         yAxes: [{
//           display: true,
//           ticks: {
//             fontFamily: 'Inter',
//             fontColor: '#B0BAC9',
//             fontSize: 12,

//             suggestedMin: 0,    // minimum will be 0, unless there is a lower value.
//             // OR //
//             beginAtZero: true,  // minimum value will be 0.
//             maxTicksLimit: 2000,
//             stepSize: 500,
//             padding: 5,
//           },
//           gridLines: {
//             display: false
//           }
//         }]
//       }
//     }
//   }
// };