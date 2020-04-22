const chalk = require('chalk');
const semver = require('semver');
const BaseGenerator = require('generator-jhipster/generators/generator-base');
const jhipsterConstants = require('generator-jhipster/generators/generator-constants');
const fs = require('fs');
const glob = require('glob');
const _ = require('lodash');

const constants = require('../generator-constants');
const genUtils = require('../utils');
const packagejs = require('../../package.json');

module.exports = class extends BaseGenerator {
  get initializing() {
    return {
      init(args) {
        if (args === 'default') {
          this.defaultSnowflake = true;
        }
        if (args === 'javers') {
          this.javersSnowflake = true;
        }
        this.registerPrettierTransform();
      },
      readConfig() {
        this.jhAppConfig = this.getAllJhipsterConfig();
        this.snowflakeFramework = this.config.get('snowflakeFramework');
        this.snowflakePage = this.config.get('snowflakePage');
        if (!this.jhAppConfig) {
          this.error('Can\'t read .yo-rc.json');
        }
      },

      displayLogo() {
        this.log(chalk.white(`Welcome to the ${chalk.bold('JHipster Entity Snowflake')} Generator! ${chalk.yellow(`v${packagejs.version}\n`)}`));
      },

      checkJHVersion() {
        const jhipsterVersion = this.jhAppConfig.jhipsterVersion;
        const minimumJhipsterVersion = packagejs.dependencies['generator-jhipster'];
        if (!semver.satisfies(jhipsterVersion, minimumJhipsterVersion)) {
          this.env.error(`${chalk.red.bold('ERROR!')}  I support only JHipster versions greater than ${minimumJhipsterVersion}...
            If you want to use Entity Snowflake with an older JHipster version, download a previous version that supports the required JHipster version.`);
        }
      },

      getEntitityNames() {
        const existingEntities = [];
        const existingEntityChoices = [];
        let existingEntityNames = [];
        try {
          existingEntityNames = fs.readdirSync('.jhipster');
        } catch (e) {
          this.log(`${chalk.red.bold('ERROR!')} Could not read entities, you might not have generated any entities yet. I will continue to install snowflake files, entities will not be updated...\n`);
        }

        existingEntityNames.forEach((entry) => {
          if (entry.indexOf('.json') !== -1) {
            const entityName = entry.replace('.json', '');
            existingEntities.push(entityName);
            existingEntityChoices.push({
              name: entityName,
              value: entityName
            });
          }
        });
        this.existingEntities = existingEntities;
        this.existingEntityChoices = existingEntityChoices;
      }
    };
  }

  prompting() {
    const done = this.async();
    const prompts = [
      // {
      //   when: () => this.snowflakeFramework === undefined,
      //   type: 'list',
      //   name: 'snowflakeFramework',
      //   message: 'Choose which snowflake framework you would like to use.',
      //   choices: [{
      //     name: 'Custom JHipster snowflakeing (works with SQL)',
      //     value: 'custom'
      //   },
      //   {
      //     name: '[BETA] Javers snowflakeing framework (works with SQL and MongoDB)',
      //     value: 'javers'
      //   }
      //   ],
      //   default: 'custom'
      // },
      {
        when: () => this.snowflakeFramework === undefined,
        type: 'list',
        name: 'updateType',
        message: 'Do you want to enable snowflake for all existing entities?',
        choices: [{
          name: 'Yes, update all',
          value: 'all'
        },
        {
          name: 'No, let me choose the entities to update',
          value: 'selected'
        }
        ],
        default: 'all'
      },
      // {
      //   when: response => this.snowflakeFramework === undefined && response.updateType !== 'all',
      //   type: 'checkbox',
      //   name: 'snowflakeEntities',
      //   message: 'Please choose the entities to be snowflake',
      //   choices: this.existingEntityChoices,
      //   default: 'none'
      // },
      // {
      //   when: () => this.snowflakePage === undefined,
      //   type: 'confirm',
      //   name: 'snowflakePage',
      //   message: 'Do you want to add an snowflake log page for entities?',
      //   default: true
      // }
    ];
    this.prompt(prompts).then((props) => {
      this.updateType = props.updateType;
      done();
    });
    // if (this.defaultSnowflake) {
    //   this.snowflakeFramework = 'custom';
    //   this.updateType = 'all';
    //   this.snowflakePage = true;
    //   done();
    // } else if (this.javersSnowflake) {
    //   this.snowflakeFramework = 'javers';
    //   this.updateType = 'all';
    //   this.snowflakePage = true;
    //   done();
    // } else if (this.snowflakeFramework === undefined) {
    //   this.prompt(prompts).then((props) => {
    //     this.snowflakeFramework = this.snowflakeFramework || props.snowflakeFramework;
    //     this.updateType = props.updateType;
    //     this.snowflakePage = this.snowflakePage || props.snowflakePage;
    //     this.snowflakeEntities = props.snowflakeEntities;


    //     // Check if an invalid database, snowflakeFramework is selected
    //     if (this.snowflakeFramework === 'custom' && this.jhAppConfig.databaseType === 'mongodb') {
    //       this.env.error(`${chalk.red.bold('ERROR!')} The JHipster snowflake framework supports SQL databases only...\n`);
    //     } else if (this.snowflakeFramework === 'javers' && this.jhAppConfig.databaseType !== 'sql' && this.jhAppConfig.databaseType !== 'mongodb') {
    //       this.env.error(`${chalk.red.bold('ERROR!')} The Javers snowflake framework supports only SQL or MongoDB databases...\n`);
    //     }

    //     done();
    //   });
    // } else {
    //   done();
    // }
    
  }
  get writing() {
    return {
      updateYeomanConfig() {
        this.config.set('snowflakeFramework', this.snowflakeFramework);
        this.config.set('snowflakePage', this.snowflakePage);
      },

      setupGlobalVar() {
        // read config from .yo-rc.json
        this.baseName = this.jhAppConfig.baseName;
        this.packageName = this.jhAppConfig.packageName;
        this.buildTool = this.jhAppConfig.buildTool;
        this.databaseType = this.jhAppConfig.databaseType;
        this.devDatabaseType = this.jhAppConfig.devDatabaseType;
        this.prodDatabaseType = this.jhAppConfig.prodDatabaseType;
        this.enableTranslation = this.jhAppConfig.enableTranslation;
        this.languages = this.jhAppConfig.languages;
        this.clientFramework = this.jhAppConfig.clientFramework;
        this.hibernateCache = this.jhAppConfig.hibernateCache;
        this.packageFolder = this.jhAppConfig.packageFolder;
        this.clientPackageManager = this.jhAppConfig.clientPackageManager;
        this.buildTool = this.jhAppConfig.buildTool;
        this.cacheProvider = this.jhAppConfig.cacheProvider;
        this.skipFakeData = this.jhAppConfig.skipFakeData;
        this.skipServer = this.jhAppConfig.skipServer;
        this.skipClient = this.jhAppConfig.skipClient;
        // use function in generator-base.js from generator-jhipster
        this.angularAppName = this.getAngularAppName();
        this.angularXAppName = this.getAngularXAppName();
        this.changelogDate = this.dateFormatForLiquibase();
        this.jhiPrefix = this.jhAppConfig.jhiPrefix;
        this.jhiPrefixDashed = _.kebabCase(this.jhiPrefix);
        this.jhiTablePrefix = this.getTableName(this.jhiPrefix);

        // use constants from generator-constants.js
        this.webappDir = jhipsterConstants.CLIENT_MAIN_SRC_DIR;
        this.javaTemplateDir = '.';
        this.javaDir = `${jhipsterConstants.SERVER_MAIN_SRC_DIR + this.packageFolder}/`;
        this.resourceDir = jhipsterConstants.SERVER_MAIN_RES_DIR;
        this.interpolateRegex = jhipsterConstants.INTERPOLATE_REGEX;

        // if changelogDate for entity snowflake already exists then use this existing changelogDate
        const liquibaseFileName = glob.sync(`${this.resourceDir}/config/liquibase/changelog/*_added_entity_EntitySnowflakeEvent.xml`)[0];
        if (liquibaseFileName) {
          this.changelogDate = new RegExp('/config/liquibase/changelog/(.*)_added_entity_EntitySnowflakeEvent.xml').exec(liquibaseFileName)[1];
        }
      },

      writeBaseFiles() {
        if (this.skipServer) return;

        let files;
        // if (this.snowflakeFramework === 'custom') {
          
        // } 
        // collect files to copy
        files = [
          {
            from: `${this.javaTemplateDir}/SnowFlake.java.ejs`,
            to: `${this.javaDir}util/SnowFlake.java`
          }
        ];
        genUtils.copyFiles(this, files);
      },

      updateEntityFiles() {
        // Update existing entities to enable snowflake
        if (this.updateType === 'all') {
          this.snowflakeEntities = this.existingEntities;
        }
        if (this.snowflakeEntities && this.snowflakeEntities.length > 0 && this.snowflakeEntities !== 'none') {
          this.log(`\n${chalk.bold.green('I\'m Updating selected entities ')}${chalk.bold.yellow(this.snowflakeEntities)}`);
          this.log(`\n${chalk.bold.yellow('Make sure these classes does not extend any other class to avoid any errors during compilation.')}`);
          let jsonObj = null;

          this.snowflakeEntities.forEach((entityName) => {
            const entityFile = `.jhipster/${entityName}.json`;
            jsonObj = this.fs.readJSON(entityFile);

            // flag this entity as snowflake so the :entity subgenerator
            // can pick up all snowflake entities
            // technically this is only needed for Javers, as the custom
            // framework obtains this list at runtime using
            // `EntitySnowflakeEventRepository.findAllEntityTypes`;
            this.updateEntityConfig(entityFile, 'enableEntitySnowflake', true);

            if (!this.skipServer) {
              genUtils.updateEntitySnowflake.call(this, entityName, jsonObj, this.javaDir, this.resourceDir, false, this.skipFakeData);
            }
          });
        }
      },

      registering() {
        // Register this generator as a dev dependency
        this.addNpmDevDependency('generator-jhipster-snowflake', packagejs.version);
        // Register post-app and post-entity hook
        try {
          this.registerModule('generator-jhipster-snowflake', 'app', 'post', 'app', 'Add support for entity snowflake and snowflake log page');
          this.registerModule('generator-jhipster-snowflake', 'entity', 'post', 'entity', 'Add support for entity snowflake and snowflake log page');
        } catch (err) {
          this.log(`${chalk.red.bold('WARN!')} Could not register as a jhipster post app and entity creation hook...\n`);
        }
      }
    };
  }


  install() {
    const logMsg =
      `To install your dependencies manually, run: ${chalk.yellow.bold(`${this.clientPackageManager} install`)}`;

    const injectDependenciesAndConstants = (err) => {
      if (err) {
        this.warning('Install of dependencies failed!');
        this.log(logMsg);
      }
    };
    const installConfig = {
      npm: this.clientPackageManager !== 'yarn',
      yarn: this.clientPackageManager === 'yarn',
      bower: false,
      callback: injectDependenciesAndConstants
    };
    if (this.options['skip-install']) {
      this.log(logMsg);
    } else {
      this.installDependencies(installConfig);
    }
  }

  end() {
    this.log(`\n${chalk.bold.green('Snowflakeing enabled for entities, you will have an option to enable snowflake while creating new entities as well')}`);
    this.log(`\n${chalk.bold.green('I\'m running webpack now')}`);
  }
};
