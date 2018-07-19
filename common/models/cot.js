'use strict';

const debug = require('debug')('api:models:cot');
const request = require('request-promise');
const ArbaClient = require('../../server/libs/arba-client');
const _ = require('lodash');

module.exports = function(Cot) {
  Cot.newCot = function(data, next) {
    const Remito = Cot.app.models.remito;
    const Producto = Cot.app.models.producto;
    // creates a new COT instance
    const cot  = new Cot(data);
    // creates an array of Remitos instance
    const remitos = _.map(data.remitos, (r) => {
      r.cuit_empresa = data.cuit_empresa;
      return new Remito(r);
    });
    // creates an array of Productos instance
    const productos = _.reduce(data.remitos, (acc, remito) => {
      if (!remito.productos)
        return next('Existe un remito sin productos');
      return _.map(remito.productos, (p)=> {
        return new Producto(p);
      }).concat(acc);
    }, []);

    const toValidate = _.concat(remitos, productos);
    Promise.all(
      _.map(toValidate, (v) => { return v.save(); })
    ).then((models) => {
      return cot.save();
    }).then((cot) => {
      return ArbaClient.sendCOT(cot);
    }).then((a) => {
      console.log(a);
      return next(null, cot);
    }).catch((error) => {
      return next(error);
    });
  };

  // Cot.observe('before save', function loadInToARBA(ctx, next) {
  //
  // });

  Cot.remoteMethod('newCot', {
    http: {path: '/', verb: 'POST'},
    accepts: [{
      arg: 'data',
      type: 'object',
      description: 'Creates a new COT on the ARBA system',
      http: {source: 'body'},
      required: true,
    }],
    returns: {
      arg: 'COT',
      type: 'object',
      root: true,
      description: 'COT',
    },
  });
};
