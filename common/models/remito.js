'use strict';

const debug = require('debug')('api:models:remito');
const _ = require('lodash');
const moment = require('moment-timezone');

const PLATE_REGEX = new RegExp('^[A-Z]{2}[0-9]{3}[A-Z]{2}$|^[A-Z]{3}[0-9]{3}$');

const CODIGO_DGI = [
  {code: '74', type: 'P', name: 'CARTA DE PORTE'},
  {code: '91', type: 'R', name: 'REMITO R'},
  {code: '01', type: 'A', name: 'FACTURA A'},
  {code: '60', type: 'A', name: 'CUENTA DE VENTA Y LIQUIDO PRODUCTO A'},
  {code: '94', type: 'X', name: 'REMITO X'},
  {code: '06', type: 'B', name: 'FACTURA B'},
  {code: '92', type: 'C', name: 'FACTURA C'},
  {code: '51', type: 'M', name: 'FACTURA M'},
  {code: '61', type: 'B', name: 'CUENTA DE VENTA Y LIQUIDO PRODUCTO B'},
  {code: '93', type: 'C', name: 'CUENTA DE VENTA Y LIQUIDO PRODUCTO C'},
  {code: '58', type: 'M', name: 'CUENTA DE VENTA Y LIQUIDO PRODUCTO M'},
  {code: '95', type: 'G', name: 'GUIA UNICA DE TRASLADO'},
  {code: '97', type: 'E', name: 'DOCUMENTO EQUIVALENTE'},
];

const CODIGO_PROVINCIA = [
  {code: 'A',	name: 'Salta'},
  {code: 'B',	name: 'Buenos Aires'},
  {code: 'C',	name: 'Capital Federal'},
  {code: 'D',	name: 'San Luis'},
  {code: 'E',	name: 'Entre Ríos'},
  {code: 'F',	name: 'La Rioja'},
  {code: 'G',	name: 'Santiago del Estero'},
  {code: 'H',	name: 'Chaco'},
  {code: 'J',	name: 'San Juan'},
  {code: 'K',	name: 'Catamarca'},
  {code: 'L',	name: 'La Pampa'},
  {code: 'M',	name: 'Mendoza'},
  {code: 'N',	name: 'Misiones'},
  {code: 'P',	name: 'Formosa'},
  {code: 'Q',	name: 'Neuquen'},
  {code: 'R',	name: 'Río Negro'},
  {code: 'S',	name: 'Santa Fé'},
  {code: 'T',	name: 'Tucumán'},
  {code: 'U',	name: 'Chubut'},
  {code: 'V',	name: 'Tierra del Fuego'},
  {code: 'W',	name: 'Corrientes'},
  {code: 'X',	name: 'Córdoba'},
  {code: 'Y',	name: 'Jujuy'},
  {code: 'Z',	name: 'Santa Cruz'},
];

/**
* ARBA documentation http://www.arba.gov.ar/archivos/Publicaciones/diseno%20txt.pdf
* Codes & Tables for validation http://www.arba.gov.ar/Transporte_Bienes/VerPDF.asp?param=TV
*/
module.exports = function(Remito) {
  // codigo_unico_dgi validation
  Remito.validate('codigo_unico_dgi', function(error) {
    const remito = this;
    const isValid = _.find(CODIGO_DGI, (dgi) => {
      return remito.codigo_unico_dgi == dgi.code;
    });
    if (!isValid) error();
  }, {
    message: 'parametro invalido: codigo_unico_dgi',
  });

  // codigo_unico_tipo validation
  Remito.validate('codigo_unico_tipo', function(error) {
    const remito = this;
    const isValid = _.find(CODIGO_DGI, (dgi) => {
      return remito.codigo_unico_dgi == dgi.code &&
        remito.codigo_unico_tipo == dgi.type;
    });
    if (!isValid) error();
  }, {
    message: 'parametro invalido: codigo_unico_tipo',
  });

  // codigo_unico_prefijo validation
  Remito.validate('codigo_unico_prefijo', function(error) {
    const regex = new RegExp('^[0-9]{4}$');
    if (!regex.test(this.codigo_unico_prefijo)) error();
  }, {
    message: 'parametro invalido: codigo_unico_prefijo',
  });

  // codigo_unico_numero validation
  Remito.validate('codigo_unico_numero', function(error) {
    const regex = new RegExp('^[0-9]{8}$');
    if (!regex.test(this.codigo_unico_numero)) error();
  }, {
    message: 'parametro invalido: codigo_unico_numero',
  });

  // fecha_salida_transporte validation
  // salida >= emisión y >= hoy menos uno y <= hoy mas treinta
  Remito.validate('fecha_salida_transporte', function(error) {
    const remito = this;
    const fechaSalida = moment(remito.fecha_salida_transporte);
    const fechaEmision = moment(remito.fecha_emision);
    const isValid = (fechaSalida.diff(fechaEmision, 'days') >= 0 &&
      fechaSalida.diff(moment().subtract(1, 'day'), 'days') >= 0 &&
      fechaSalida.diff(moment().add(30, 'day'), 'days') <= 0);

    if (!isValid) error();
  }, {
    message: 'parametro invalido: fecha_salida',
  });

  // sujeto_generador validation
  Remito.validatesInclusionOf('sujeto_generador', {in: ['E', 'D']});

  // destinatario_tipo_documento validation
  Remito.validatesInclusionOf('destinatario_tipo_documento', {in: [
    'DNI', 'LC', 'LE', 'PAS', 'CI',
  ]});

  // destinatario_cuit validation
  // Requerido si consumidor final= 0
  // Si SUJETO_GENERADOR = 'D' debe ser igual a CUIT_EMPRESA
  Remito.validate('destinatario_cuit', function(error) {
    const remito = this;
    if (remito.destinatario_consumidor_final == ' ' &&
      remito.destinatario_cuit == ' ')
      error();
    if (remito.sujeto_generador == 'D' &&
      remito.cuit_empresa != remito.destinatario_cuit)
      error();
  }, {
    message: 'parametro invalido: destinatario_cuit',
  });

  // destinatario_razon_social validation
  // Requerido si consumidor final= 0
  Remito.validate('destinatario_razon_social', function(error) {
    const remito = this;
    if (remito.destinatario_consumidor_final == ' ' &&
      remito.destinatario_razon_social == ' ')
      error();
  }, {
    message: 'parametro invalido: destinatario_razon_social',
  });

  // destinatario_tenedor validation
  Remito.validate('destinatario_tenedor', function(error) {
    const remito = this;
    if (remito.destinatario_consumidor_final ==
        remito.destinatario_razon_social)
      error();
  }, {
    message: 'parametro invalido: destinatario_tenedor',
  });

  // destino_domicilio_numero validation
  // >0 si destino_domicilio_comple distinto de 'S/N'
  // =0 (cero) ó ' ' (blanco) si destino_domicilio_comple = 'S/N'
  Remito.validate('destino_domicilio_numero', function(error) {
    const remito = this;
    if (remito.destino_domicilio_comple != 'S/N' &&
        !remito.destino_domicilio_numero > 0)
      error();
    if (remito.destino_domicilio_comple == 'S/N' &&
        (remito.destino_domicilio_numero !== 0 ||
        remito.destino_domicilio_numero !== ' '))
      error();
  }, {
    message: 'parametro invalido: destino_domicilio_numero',
  });

  // destino_domicilio_comple validation
  Remito.validatesInclusionOf('destino_domicilio_comple', {in: [
    ' ', 'S/N', '1/2', '1/4', 'BIS',
  ]});

  // destino_domicilio_provincia validation
  Remito.validate('destino_domicilio_provincia', function(error) {
    const remito = this;
    const isValid = _.find(CODIGO_PROVINCIA, (p) => {
      return remito.destino_domicilio_provincia == p.code;
    });
    if (!isValid) error();
  }, {
    message: 'parametro invalido: destino_domicilio_provincia',
  });

  // origen_cuit validation
  // Requerido si consumidor final= 0
  // Si SUJETO_GENERADOR = 'E' debe ser igual a CUIT_EMPRESA
  Remito.validate('origen_cuit', function(error) {
    const remito = this;
    if (remito.sujeto_generador == 'E' &&
      remito.cuit_empresa != remito.origen_cuit)
      error();
  }, {
    message: 'parametro invalido: origen_cuit',
  });

  // origen_domicilio_numero validation
  // >0 si origen_domicilio_comple distinto de 'S/N'
  // =0 (cero) ó ' ' (blanco) si origen_domicilio_comple = 'S/N'
  Remito.validate('origen_domicilio_numero', function(error) {
    const remito = this;
    if (remito.origen_domicilio_comple != 'S/N' &&
        !remito.origen_domicilio_numero > 0)
      error();
    if (remito.origen_domicilio_comple == 'S/N' &&
        (remito.origen_domicilio_numero !== 0 ||
        remito.origen_domicilio_numero !== ' '))
      error();
  }, {
    message: 'parametro invalido: origen_domicilio_numero',
  });

  // origen_domicilio_provincia validation
  Remito.validate('origen_domicilio_provincia', function(error) {
    const remito = this;
    const isValid = _.find(CODIGO_PROVINCIA, (p) => {
      return remito.origen_domicilio_provincia == p.code;
    });
    if (!isValid) error();
  }, {
    message: 'parametro invalido: origen_domicilio_provincia',
  });

  // tipo_recorrido validation
  // URBANO,RURAL, MIXTO, en blanco
  Remito.validatesInclusionOf('tipo_recorrido', {in: [
    'U', 'R', 'M', ' ',
  ]});

  // patente_vehiculo validation
  Remito.validate('patente_vehiculo', function(error) {
    const remito = this;
    if (remito.transportista_cuit == remito.cuit_empresa ||
      remito.patente_vehiculo != '') {
      const isValid = PLATE_REGEX.test(remito.patente_vehiculo.toUpperCase());
      if (!isValid) error();
    }
  }, {
    message: 'parametro invalido: patente_vehiculo',
  });

  // patente_acoplado validation
  Remito.validate('patente_acoplado', function(error) {
    const remito = this;
    if (remito.patente_acoplado != '') {
      const isValid = PLATE_REGEX.test(remito.patente_acoplado.toUpperCase());
      if (!isValid) error();
    }
  }, {
    message: 'parametro invalido: patente_acoplado',
  });

  // importe validation
  // Obligatorio siempre salvo si campo
  // PRODUCTO_NO_TERM_DEV = 1 o ORIGEN_CUIT = DESTINATARIO_CUIT
  Remito.validate('importe', function(error) {
    const remito = this;
    if (remito.importe == 0 && !(remito.producto_no_term_dev ||
      remito.origen_cuit == remito.destinatario_cuit)) {
      error(`Importe $0 solo valido cuando
        producto_no_term_dev == true u origen_cuit == destinatario_cuit`);
    } else if (remito.importe < 0 || remito.importe > 10000000) {
      error('el importe debe ser mayor a 0 y menor a 10000000');
    }
  });
};
