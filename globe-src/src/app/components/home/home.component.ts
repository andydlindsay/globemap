import { Component, OnInit } from '@angular/core';
import { D3Service, D3, Selection, SimulationNodeDatum, SimulationLinkDatum, ForceLink } from 'd3-ng2-service';
import { Title } from '@angular/platform-browser';
import { DataService } from '../../services/data.service';
import { legendColor } from 'd3-svg-legend';
import * as topojson from 'topojson';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})

export class HomeComponent implements OnInit {

  private d3: D3;
  dataset: any;
  meteors: any;

  constructor(
    d3Service: D3Service,
    private titleService: Title,
    private data: DataService
  ) {
    this.d3 = d3Service.getD3();
  }

  ngOnInit() {
    // title the page
    this.titleService.setTitle('Globe Map - FCC');

    this.data.getJson().subscribe(
      data => {
        if (data) {
          this.dataset = data;
          // console.log(data);
          this.data.getMeteor().subscribe(
            data => {
              if (data) {
                this.meteors = data.features;
                // console.log(data);
                this.drawGlobeMap();
              }
            }
          );
        }
      }
    );

  }

  drawGlobeMap() {
    // alias d3
    const d3 = this.d3;

    // setup svg component
    const width = 1412,
          height = 716,
          padding = 50;

    // append svg component
    // zoom based on Sebastian Gruhier's post
    // https://coderwall.com/p/psogia/simplest-way-to-add-zoom-pan-on-d3-js
    const svg = d3.select("#svg")
      .append("svg")
      .attr("class", "svg")
      .attr("width", width)
      .attr("height", height)
      .call(d3.zoom().on('zoom', () => {
        svg.attr('transform', d3.event.transform);
      }))
      .append('g');

    // tooltip
    const div = d3.select('#svg')
      .append('div')
      .attr('class', 'tooltip')
      .style('opacity', 0);

    // projection
    const projection = d3.geoEquirectangular()
      .scale(230)
      .translate([width / 2, height / 2]);

    const path = d3.geoPath()
      .projection(projection);

    // map
    svg.append('g')
      .attr('class', 'land')
      .selectAll('path')
      .data([topojson.feature(this.dataset, this.dataset.objects.land)])
      .enter().append('path')
      .attr('d', path);

    // longitude 360 (-180 to +180 not inc 0), latitude 181 (-90 to +90 inc 0)
    const oneDegLong = width / 360;
    const oneDegLat = height / 181;
    const zeroLong = width / 2;
    const zeroLat = height / 2;

    // meteor scale
    const minMass = d3.min(this.meteors, (d) => Number(d['properties']['mass']));
    const maxMass = d3.max(this.meteors, (d) => Number(d['properties']['mass']));
    const meteorScale = d3.scaleLog()
      // .domain([minMass, maxMass])
      .range([1.25, 1.75]);

    console.log('meteorScale(2500):', meteorScale(2500));
    console.log('meteorScale(2500000):', meteorScale(2500000));

    // draw circles on map at specific locations
    svg.selectAll('circle')
      .data(this.meteors)
      .enter()
      .append('circle')
      .attr('cx', (d) => {
        if (d['geometry'] != null) {
          return (d['geometry']['coordinates'][0] * oneDegLong) + zeroLong;
        } else {
          return -100;
        }
      })
      .attr('cy', (d) => {
        if (d['geometry'] != null) {
          return zeroLat - (d['geometry']['coordinates'][1] * oneDegLat);
        } else {
          return -100;
        }
      })
      .attr('r', (d) => {
        return meteorScale(d['properties']['mass']);
      })
      .attr('fill', (d) => {
        if (d['properties']['mass'] < 250) {
          return '#BF5300';
        } else if (d['properties']['mass'] < 500) {
          return '#C28F00';
        } else if (d['properties']['mass'] < 2500) {
          return '#BFC600';
        } else if (d['properties']['mass'] < 5000) {
          return '#86CA00';
        } else if (d['properties']['mass'] < 10000) {
          return '#4BCE00';
        } else if (d['properties']['mass'] < 25000) {
          return '#00DDB9';
        } else if (d['properties']['mass'] < 100000) {
          return '#00C2E1';
        } else if (d['properties']['mass'] < 500000) {
          return '#0081E5';
        } else if (d['properties']['mass'] < 1000000) {
          return '#2677B7';
        } else if (d['properties']['mass'] < 5000000) {
          return '#8700D5';
        } else {
          return '#C400D2';
        }
      })
      .style('opacity', 0.65)
      .on('mouseover', (d) => {
        div.transition()
          .duration(100)
          .style('opacity', 1);
        div.html('<h2>Name: ' + d['properties']['name'] + '</h2>'
               + '<h2>Mass: ' + d['properties']['mass'] + '</h2>'
               + '<h2>Class: ' + d['properties']['recclass'] + '</h2>'
               + '<h2>Lat: ' + d['properties']['reclat'] + '</h2>'
               + '<h2>Long: ' + d['properties']['reclong'] + '</h2>'
               + '<h2>Year: ' + String(d['properties']['year']).slice(0, 4) + '</h2>'
          )
          .style('left', (d3.event.pageX - 90) + 'px')
          .style('top', (d3.event.pageY - 50) + 'px');
      })
      .on('mouseout', (d) => {
        div.transition()
          .duration(750)
          .style('opacity', 0);
      });



  }

}
