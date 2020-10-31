var myGeoJSONPath = "custom.geo.json";
var myCustomStyle = {
  stroke: true,
  color: "#909090",
  weight: 1,
  fill: true,
  fillColor: "#fff",
  fillOpacity: 1,
};

function shareFacebook() {
  window.open(
    "https://www.facebook.com/sharer/sharer.php?u=https://whereiscountry.ga&quote=" +
      shareText,
    "popup",
    "width=600,height=600"
  );
  return false;
}

function shareTwitter() {
  window.open(
    "https://twitter.com/intent/tweet?text=" +
      shareText +
      "%20https://whereiscountry.ga%20%23WhereInTheWorldIsThisCountryGame",
    "popup",
    "width=600,height=600"
  );
  return false;
}

var score = { wrong: 0, correct: 0, region: 0, total: 0 };
var layers = [];
var selectedLayer = null;
var popupOpen = false;
var gameOver = false;
var shareText = "";

$("#difficultyModal").modal();
$("#difficultyModal").on("hide.bs.modal", function (e) {
  var difficulty = $('input[name="difficulty"]:checked').val();
  if (difficulty === "Hard") {
    myCustomStyle.stroke = false;
  }
  $.getJSON(myGeoJSONPath, function (data) {
    var map = L.map("map").setView([40, 0], 2.5);

    function onMapClick(e) {
      if (popupOpen) return;
      if(gameOver){
        openGameOverPopup();
        return;
      }
      if (
        !selectedLayer ||
        !selectedLayer.feature ||
        !selectedLayer.feature.properties ||
        !selectedLayer.feature.properties.brk_name
      ) {
        question();
      }
      var horizontalPadding =
        window.screen.width > 500 ? window.screen.width / 4 : 0;
      window.popup = L.popup({
        closeOnClick: false,
        keepInView: true,
        autoClose: false,
        maxWidth: 250,
        autoPanPadding: [horizontalPadding, window.screen.width / 4],
      });
      window.popup
        .setLatLng(selectedLayer.getBounds().getCenter())
        //.setContent(
        //  "You clicked the map at " + e.target.feature.properties.brk_name
        //)
        .setContent("Here is " + selectedLayer.feature.properties.brk_name)
        .openOn(map);
      popupOpen = true;

      window.popup._closeButton.onclick = function (e) {
        popupOpen = false;
        if (score.wrong > 9) {
          openGameOverPopup();
          gameOver = true;
        } else {
          setTimeout(function () {
            window.popup._close();
            question();
          }, 1);
        }
      };

      var markerColor = "#fc0505";
      var sucessText = "";
      if (
        e.target.feature.properties.brk_name ===
        selectedLayer.feature.properties.brk_name
      ) {
        markerColor = "#05fc4f";
        selectedLayer.setStyle({
          fillColor: "#01b28f",
        });
        sucessText = "Well done! ";
        score.correct++;
        score.total += 100;
        $("#pointsGot").text("+100");
        setTimeout(function () {
          $("#pointsGot").text("");
        }, 3000);
        $("#correct").text(score.correct);
        layers.splice(layers.indexOf(originalSelectedLayer), 1);
        if (layers.length === 0) {
          gameOver = true;
          openGameOverPopup();
          $("#gameover_success").text(
            "Congratulations! You found all countries! You are a geography master!!"
          );
        }
      } else {
        if (
          selectedLayer.feature.properties.subregion ===
          e.target.feature.properties.subregion
        ) {
          var distanceBetweenPoints =
            selectedLayer.getBounds().getCenter().distanceTo(e.latlng) / 7000; //Reduce scale of distance
          // console.log("distanceBetweenPoints:" + distanceBetweenPoints);
          // console.log(
          //   "points got:" +
          //     (50 + (50 / distanceBetweenPoints) * 50).toFixed(0)
          // );
          var pointsGot = 50 + (50 / distanceBetweenPoints) * 50;
          if (pointsGot >= 100) {
            pointsGot = 90;
          }
          score.total += pointsGot;
          sucessText =
            "Almost! You got the region correct: " +
            selectedLayer.feature.properties.subregion +
            ". ";
          $("#pointsGot").text("+" + pointsGot.toFixed());
          setTimeout(function () {
            $("#pointsGot").text("");
          }, 3000);
          markerColor = "#ffc60a";
          selectedLayer.setStyle({
            fillColor: "#dba800",
          });
          score.region++;
          $("#region").text(score.region);
        } else {
          selectedLayer.setStyle({
            fillColor: "#b22d01",
          });
          score.wrong++;
          $("#wrong").text(score.wrong);
        }
        // console.log(selectedLayer.feature.properties.subregion);
        // console.log(e.target.feature.properties.subregion);
      }
      shareText = `My total score was ${score.total.toFixed(0)}! Correct: ${
        score.correct
      } Region: ${score.region} Wrong: ${
        score.wrong
      } Difficulty: ${difficulty}`;
      //test comment
      $("#score").text(score.total.toFixed(0));

      L.circleMarker([e.latlng.lat, e.latlng.lng], {
        radius: 5,
        color: markerColor,
        fillOpacity: 0.5,
      }).addTo(map);

      window.popup
        .setLatLng(selectedLayer.getBounds().getCenter())
        //.setContent(
        //  "You clicked the map at " + e.target.feature.properties.brk_name
        //)
        .setContent(
          sucessText + "Here is " + selectedLayer.feature.properties.brk_name
        )
        .openOn(map);
      popupOpen = true;
    }

    function question() {
      originalSelectedLayer = layers[(Math.random() * 175).toFixed(0)];
      selectedLayer = originalSelectedLayer;
      if (
        selectedLayer &&
        selectedLayer._layers &&
        Object.getOwnPropertyNames(selectedLayer._layers).length
      ) {
        selectedLayer =
          selectedLayer._layers[
            Object.getOwnPropertyNames(selectedLayer._layers)[0]
          ];
      }
      if (
        !selectedLayer ||
        !selectedLayer.feature ||
        !selectedLayer.feature.properties ||
        !selectedLayer.feature.properties.brk_name
      ) {
        question();
      } else {
        $("#questionModal").modal();
        $("#questionText").text(
          "Where is " + selectedLayer.feature.properties.brk_name + "?"
        );
      }
    }

    function openGameOverPopup() {
      $("#gameOverModal").modal();
      $("#gameover_correct").text(score.correct);
      $("#gameover_region").text(score.region);
      $("#gameover_wrong").text(score.wrong);
      $("#gameover_score").text(score.total.toFixed(0));
    }

    function onEachFeature(feature, layer) {
      //bind click
      layer.on("click", function (e) {
        onMapClick(e);
        // e = event

        // You can make your ajax call declaration here
        //$.ajax(...
      });
      layers.push(layer);

      if (layers.length > 174) {
        question();
      }
    }

    L.geoJson(data, {
      clickable: true,
      style: myCustomStyle,
      onEachFeature: onEachFeature,
    }).addTo(map);
  });
});

var elem = document.documentElement;
function openFullscreen() {
  if (elem.requestFullscreen) {
    elem.requestFullscreen();
  } else if (elem.webkitRequestFullscreen) {
    /* Safari */
    elem.webkitRequestFullscreen();
  } else if (elem.msRequestFullscreen) {
    /* IE11 */
    elem.msRequestFullscreen();
  }
}

function closeFullscreen() {
  if (document.exitFullscreen) {
    document.exitFullscreen();
  } else if (document.webkitExitFullscreen) {
    /* Safari */
    document.webkitExitFullscreen();
  } else if (document.msExitFullscreen) {
    /* IE11 */
    document.msExitFullscreen();
  }
}
