var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
var __publicField = (obj, key, value) => {
  __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
  return value;
};

// node_modules/unenv/dist/runtime/_internal/utils.mjs
function createNotImplementedError(name) {
  return new Error(`[unenv] ${name} is not implemented yet!`);
}
__name(createNotImplementedError, "createNotImplementedError");
function notImplemented(name) {
  const fn = /* @__PURE__ */ __name(() => {
    throw createNotImplementedError(name);
  }, "fn");
  return Object.assign(fn, { __unenv__: true });
}
__name(notImplemented, "notImplemented");
function notImplementedClass(name) {
  return class {
    __unenv__ = true;
    constructor() {
      throw new Error(`[unenv] ${name} is not implemented yet!`);
    }
  };
}
__name(notImplementedClass, "notImplementedClass");

// node_modules/unenv/dist/runtime/node/internal/perf_hooks/performance.mjs
var _timeOrigin = globalThis.performance?.timeOrigin ?? Date.now();
var _performanceNow = globalThis.performance?.now ? globalThis.performance.now.bind(globalThis.performance) : () => Date.now() - _timeOrigin;
var nodeTiming = {
  name: "node",
  entryType: "node",
  startTime: 0,
  duration: 0,
  nodeStart: 0,
  v8Start: 0,
  bootstrapComplete: 0,
  environment: 0,
  loopStart: 0,
  loopExit: 0,
  idleTime: 0,
  uvMetricsInfo: {
    loopCount: 0,
    events: 0,
    eventsWaiting: 0
  },
  detail: void 0,
  toJSON() {
    return this;
  }
};
var PerformanceEntry = class {
  __unenv__ = true;
  detail;
  entryType = "event";
  name;
  startTime;
  constructor(name, options) {
    this.name = name;
    this.startTime = options?.startTime || _performanceNow();
    this.detail = options?.detail;
  }
  get duration() {
    return _performanceNow() - this.startTime;
  }
  toJSON() {
    return {
      name: this.name,
      entryType: this.entryType,
      startTime: this.startTime,
      duration: this.duration,
      detail: this.detail
    };
  }
};
__name(PerformanceEntry, "PerformanceEntry");
var PerformanceMark = /* @__PURE__ */ __name(class PerformanceMark2 extends PerformanceEntry {
  entryType = "mark";
  constructor() {
    super(...arguments);
  }
  get duration() {
    return 0;
  }
}, "PerformanceMark");
var PerformanceMeasure = class extends PerformanceEntry {
  entryType = "measure";
};
__name(PerformanceMeasure, "PerformanceMeasure");
var PerformanceResourceTiming = class extends PerformanceEntry {
  entryType = "resource";
  serverTiming = [];
  connectEnd = 0;
  connectStart = 0;
  decodedBodySize = 0;
  domainLookupEnd = 0;
  domainLookupStart = 0;
  encodedBodySize = 0;
  fetchStart = 0;
  initiatorType = "";
  name = "";
  nextHopProtocol = "";
  redirectEnd = 0;
  redirectStart = 0;
  requestStart = 0;
  responseEnd = 0;
  responseStart = 0;
  secureConnectionStart = 0;
  startTime = 0;
  transferSize = 0;
  workerStart = 0;
  responseStatus = 0;
};
__name(PerformanceResourceTiming, "PerformanceResourceTiming");
var PerformanceObserverEntryList = class {
  __unenv__ = true;
  getEntries() {
    return [];
  }
  getEntriesByName(_name, _type) {
    return [];
  }
  getEntriesByType(type) {
    return [];
  }
};
__name(PerformanceObserverEntryList, "PerformanceObserverEntryList");
var Performance = class {
  __unenv__ = true;
  timeOrigin = _timeOrigin;
  eventCounts = /* @__PURE__ */ new Map();
  _entries = [];
  _resourceTimingBufferSize = 0;
  navigation = void 0;
  timing = void 0;
  timerify(_fn, _options) {
    throw createNotImplementedError("Performance.timerify");
  }
  get nodeTiming() {
    return nodeTiming;
  }
  eventLoopUtilization() {
    return {};
  }
  markResourceTiming() {
    return new PerformanceResourceTiming("");
  }
  onresourcetimingbufferfull = null;
  now() {
    if (this.timeOrigin === _timeOrigin) {
      return _performanceNow();
    }
    return Date.now() - this.timeOrigin;
  }
  clearMarks(markName) {
    this._entries = markName ? this._entries.filter((e) => e.name !== markName) : this._entries.filter((e) => e.entryType !== "mark");
  }
  clearMeasures(measureName) {
    this._entries = measureName ? this._entries.filter((e) => e.name !== measureName) : this._entries.filter((e) => e.entryType !== "measure");
  }
  clearResourceTimings() {
    this._entries = this._entries.filter((e) => e.entryType !== "resource" || e.entryType !== "navigation");
  }
  getEntries() {
    return this._entries;
  }
  getEntriesByName(name, type) {
    return this._entries.filter((e) => e.name === name && (!type || e.entryType === type));
  }
  getEntriesByType(type) {
    return this._entries.filter((e) => e.entryType === type);
  }
  mark(name, options) {
    const entry = new PerformanceMark(name, options);
    this._entries.push(entry);
    return entry;
  }
  measure(measureName, startOrMeasureOptions, endMark) {
    let start;
    let end;
    if (typeof startOrMeasureOptions === "string") {
      start = this.getEntriesByName(startOrMeasureOptions, "mark")[0]?.startTime;
      end = this.getEntriesByName(endMark, "mark")[0]?.startTime;
    } else {
      start = Number.parseFloat(startOrMeasureOptions?.start) || this.now();
      end = Number.parseFloat(startOrMeasureOptions?.end) || this.now();
    }
    const entry = new PerformanceMeasure(measureName, {
      startTime: start,
      detail: {
        start,
        end
      }
    });
    this._entries.push(entry);
    return entry;
  }
  setResourceTimingBufferSize(maxSize) {
    this._resourceTimingBufferSize = maxSize;
  }
  addEventListener(type, listener, options) {
    throw createNotImplementedError("Performance.addEventListener");
  }
  removeEventListener(type, listener, options) {
    throw createNotImplementedError("Performance.removeEventListener");
  }
  dispatchEvent(event) {
    throw createNotImplementedError("Performance.dispatchEvent");
  }
  toJSON() {
    return this;
  }
};
__name(Performance, "Performance");
var PerformanceObserver = class {
  __unenv__ = true;
  _callback = null;
  constructor(callback) {
    this._callback = callback;
  }
  takeRecords() {
    return [];
  }
  disconnect() {
    throw createNotImplementedError("PerformanceObserver.disconnect");
  }
  observe(options) {
    throw createNotImplementedError("PerformanceObserver.observe");
  }
  bind(fn) {
    return fn;
  }
  runInAsyncScope(fn, thisArg, ...args) {
    return fn.call(thisArg, ...args);
  }
  asyncId() {
    return 0;
  }
  triggerAsyncId() {
    return 0;
  }
  emitDestroy() {
    return this;
  }
};
__name(PerformanceObserver, "PerformanceObserver");
__publicField(PerformanceObserver, "supportedEntryTypes", []);
var performance = globalThis.performance && "addEventListener" in globalThis.performance ? globalThis.performance : new Performance();

// node_modules/@cloudflare/unenv-preset/dist/runtime/polyfill/performance.mjs
globalThis.performance = performance;
globalThis.Performance = Performance;
globalThis.PerformanceEntry = PerformanceEntry;
globalThis.PerformanceMark = PerformanceMark;
globalThis.PerformanceMeasure = PerformanceMeasure;
globalThis.PerformanceObserver = PerformanceObserver;
globalThis.PerformanceObserverEntryList = PerformanceObserverEntryList;
globalThis.PerformanceResourceTiming = PerformanceResourceTiming;

// node_modules/unenv/dist/runtime/node/console.mjs
import { Writable } from "node:stream";

// node_modules/unenv/dist/runtime/mock/noop.mjs
var noop_default = Object.assign(() => {
}, { __unenv__: true });

// node_modules/unenv/dist/runtime/node/console.mjs
var _console = globalThis.console;
var _ignoreErrors = true;
var _stderr = new Writable();
var _stdout = new Writable();
var log = _console?.log ?? noop_default;
var info = _console?.info ?? log;
var trace = _console?.trace ?? info;
var debug = _console?.debug ?? log;
var table = _console?.table ?? log;
var error = _console?.error ?? log;
var warn = _console?.warn ?? error;
var createTask = _console?.createTask ?? /* @__PURE__ */ notImplemented("console.createTask");
var clear = _console?.clear ?? noop_default;
var count = _console?.count ?? noop_default;
var countReset = _console?.countReset ?? noop_default;
var dir = _console?.dir ?? noop_default;
var dirxml = _console?.dirxml ?? noop_default;
var group = _console?.group ?? noop_default;
var groupEnd = _console?.groupEnd ?? noop_default;
var groupCollapsed = _console?.groupCollapsed ?? noop_default;
var profile = _console?.profile ?? noop_default;
var profileEnd = _console?.profileEnd ?? noop_default;
var time = _console?.time ?? noop_default;
var timeEnd = _console?.timeEnd ?? noop_default;
var timeLog = _console?.timeLog ?? noop_default;
var timeStamp = _console?.timeStamp ?? noop_default;
var Console = _console?.Console ?? /* @__PURE__ */ notImplementedClass("console.Console");
var _times = /* @__PURE__ */ new Map();
var _stdoutErrorHandler = noop_default;
var _stderrErrorHandler = noop_default;

// node_modules/@cloudflare/unenv-preset/dist/runtime/node/console.mjs
var workerdConsole = globalThis["console"];
var {
  assert,
  clear: clear2,
  // @ts-expect-error undocumented public API
  context,
  count: count2,
  countReset: countReset2,
  // @ts-expect-error undocumented public API
  createTask: createTask2,
  debug: debug2,
  dir: dir2,
  dirxml: dirxml2,
  error: error2,
  group: group2,
  groupCollapsed: groupCollapsed2,
  groupEnd: groupEnd2,
  info: info2,
  log: log2,
  profile: profile2,
  profileEnd: profileEnd2,
  table: table2,
  time: time2,
  timeEnd: timeEnd2,
  timeLog: timeLog2,
  timeStamp: timeStamp2,
  trace: trace2,
  warn: warn2
} = workerdConsole;
Object.assign(workerdConsole, {
  Console,
  _ignoreErrors,
  _stderr,
  _stderrErrorHandler,
  _stdout,
  _stdoutErrorHandler,
  _times
});
var console_default = workerdConsole;

// node_modules/wrangler/_virtual_unenv_global_polyfill-@cloudflare-unenv-preset-node-console
globalThis.console = console_default;

// node_modules/unenv/dist/runtime/node/internal/process/hrtime.mjs
var hrtime = /* @__PURE__ */ Object.assign(/* @__PURE__ */ __name(function hrtime2(startTime) {
  const now = Date.now();
  const seconds = Math.trunc(now / 1e3);
  const nanos = now % 1e3 * 1e6;
  if (startTime) {
    let diffSeconds = seconds - startTime[0];
    let diffNanos = nanos - startTime[0];
    if (diffNanos < 0) {
      diffSeconds = diffSeconds - 1;
      diffNanos = 1e9 + diffNanos;
    }
    return [diffSeconds, diffNanos];
  }
  return [seconds, nanos];
}, "hrtime"), { bigint: /* @__PURE__ */ __name(function bigint() {
  return BigInt(Date.now() * 1e6);
}, "bigint") });

// node_modules/unenv/dist/runtime/node/internal/process/process.mjs
import { EventEmitter } from "node:events";

// node_modules/unenv/dist/runtime/node/internal/tty/read-stream.mjs
import { Socket } from "node:net";
var ReadStream = class extends Socket {
  fd;
  constructor(fd) {
    super();
    this.fd = fd;
  }
  isRaw = false;
  setRawMode(mode) {
    this.isRaw = mode;
    return this;
  }
  isTTY = false;
};
__name(ReadStream, "ReadStream");

// node_modules/unenv/dist/runtime/node/internal/tty/write-stream.mjs
import { Socket as Socket2 } from "node:net";
var WriteStream = class extends Socket2 {
  fd;
  constructor(fd) {
    super();
    this.fd = fd;
  }
  clearLine(dir3, callback) {
    callback && callback();
    return false;
  }
  clearScreenDown(callback) {
    callback && callback();
    return false;
  }
  cursorTo(x, y, callback) {
    callback && typeof callback === "function" && callback();
    return false;
  }
  moveCursor(dx, dy, callback) {
    callback && callback();
    return false;
  }
  getColorDepth(env2) {
    return 1;
  }
  hasColors(count3, env2) {
    return false;
  }
  getWindowSize() {
    return [this.columns, this.rows];
  }
  columns = 80;
  rows = 24;
  isTTY = false;
};
__name(WriteStream, "WriteStream");

// node_modules/unenv/dist/runtime/node/internal/process/process.mjs
var Process = class extends EventEmitter {
  env;
  hrtime;
  nextTick;
  constructor(impl) {
    super();
    this.env = impl.env;
    this.hrtime = impl.hrtime;
    this.nextTick = impl.nextTick;
    for (const prop of [...Object.getOwnPropertyNames(Process.prototype), ...Object.getOwnPropertyNames(EventEmitter.prototype)]) {
      const value = this[prop];
      if (typeof value === "function") {
        this[prop] = value.bind(this);
      }
    }
  }
  emitWarning(warning, type, code) {
    console.warn(`${code ? `[${code}] ` : ""}${type ? `${type}: ` : ""}${warning}`);
  }
  emit(...args) {
    return super.emit(...args);
  }
  listeners(eventName) {
    return super.listeners(eventName);
  }
  #stdin;
  #stdout;
  #stderr;
  get stdin() {
    return this.#stdin ??= new ReadStream(0);
  }
  get stdout() {
    return this.#stdout ??= new WriteStream(1);
  }
  get stderr() {
    return this.#stderr ??= new WriteStream(2);
  }
  #cwd = "/";
  chdir(cwd2) {
    this.#cwd = cwd2;
  }
  cwd() {
    return this.#cwd;
  }
  arch = "";
  platform = "";
  argv = [];
  argv0 = "";
  execArgv = [];
  execPath = "";
  title = "";
  pid = 200;
  ppid = 100;
  get version() {
    return "";
  }
  get versions() {
    return {};
  }
  get allowedNodeEnvironmentFlags() {
    return /* @__PURE__ */ new Set();
  }
  get sourceMapsEnabled() {
    return false;
  }
  get debugPort() {
    return 0;
  }
  get throwDeprecation() {
    return false;
  }
  get traceDeprecation() {
    return false;
  }
  get features() {
    return {};
  }
  get release() {
    return {};
  }
  get connected() {
    return false;
  }
  get config() {
    return {};
  }
  get moduleLoadList() {
    return [];
  }
  constrainedMemory() {
    return 0;
  }
  availableMemory() {
    return 0;
  }
  uptime() {
    return 0;
  }
  resourceUsage() {
    return {};
  }
  ref() {
  }
  unref() {
  }
  umask() {
    throw createNotImplementedError("process.umask");
  }
  getBuiltinModule() {
    return void 0;
  }
  getActiveResourcesInfo() {
    throw createNotImplementedError("process.getActiveResourcesInfo");
  }
  exit() {
    throw createNotImplementedError("process.exit");
  }
  reallyExit() {
    throw createNotImplementedError("process.reallyExit");
  }
  kill() {
    throw createNotImplementedError("process.kill");
  }
  abort() {
    throw createNotImplementedError("process.abort");
  }
  dlopen() {
    throw createNotImplementedError("process.dlopen");
  }
  setSourceMapsEnabled() {
    throw createNotImplementedError("process.setSourceMapsEnabled");
  }
  loadEnvFile() {
    throw createNotImplementedError("process.loadEnvFile");
  }
  disconnect() {
    throw createNotImplementedError("process.disconnect");
  }
  cpuUsage() {
    throw createNotImplementedError("process.cpuUsage");
  }
  setUncaughtExceptionCaptureCallback() {
    throw createNotImplementedError("process.setUncaughtExceptionCaptureCallback");
  }
  hasUncaughtExceptionCaptureCallback() {
    throw createNotImplementedError("process.hasUncaughtExceptionCaptureCallback");
  }
  initgroups() {
    throw createNotImplementedError("process.initgroups");
  }
  openStdin() {
    throw createNotImplementedError("process.openStdin");
  }
  assert() {
    throw createNotImplementedError("process.assert");
  }
  binding() {
    throw createNotImplementedError("process.binding");
  }
  permission = { has: /* @__PURE__ */ notImplemented("process.permission.has") };
  report = {
    directory: "",
    filename: "",
    signal: "SIGUSR2",
    compact: false,
    reportOnFatalError: false,
    reportOnSignal: false,
    reportOnUncaughtException: false,
    getReport: /* @__PURE__ */ notImplemented("process.report.getReport"),
    writeReport: /* @__PURE__ */ notImplemented("process.report.writeReport")
  };
  finalization = {
    register: /* @__PURE__ */ notImplemented("process.finalization.register"),
    unregister: /* @__PURE__ */ notImplemented("process.finalization.unregister"),
    registerBeforeExit: /* @__PURE__ */ notImplemented("process.finalization.registerBeforeExit")
  };
  memoryUsage = Object.assign(() => ({
    arrayBuffers: 0,
    rss: 0,
    external: 0,
    heapTotal: 0,
    heapUsed: 0
  }), { rss: () => 0 });
  mainModule = void 0;
  domain = void 0;
  send = void 0;
  exitCode = void 0;
  channel = void 0;
  getegid = void 0;
  geteuid = void 0;
  getgid = void 0;
  getgroups = void 0;
  getuid = void 0;
  setegid = void 0;
  seteuid = void 0;
  setgid = void 0;
  setgroups = void 0;
  setuid = void 0;
  _events = void 0;
  _eventsCount = void 0;
  _exiting = void 0;
  _maxListeners = void 0;
  _debugEnd = void 0;
  _debugProcess = void 0;
  _fatalException = void 0;
  _getActiveHandles = void 0;
  _getActiveRequests = void 0;
  _kill = void 0;
  _preload_modules = void 0;
  _rawDebug = void 0;
  _startProfilerIdleNotifier = void 0;
  _stopProfilerIdleNotifier = void 0;
  _tickCallback = void 0;
  _disconnect = void 0;
  _handleQueue = void 0;
  _pendingMessage = void 0;
  _channel = void 0;
  _send = void 0;
  _linkedBinding = void 0;
};
__name(Process, "Process");

// node_modules/@cloudflare/unenv-preset/dist/runtime/node/process.mjs
var globalProcess = globalThis["process"];
var getBuiltinModule = globalProcess.getBuiltinModule;
var { exit, platform, nextTick } = getBuiltinModule(
  "node:process"
);
var unenvProcess = new Process({
  env: globalProcess.env,
  hrtime,
  nextTick
});
var {
  abort,
  addListener,
  allowedNodeEnvironmentFlags,
  hasUncaughtExceptionCaptureCallback,
  setUncaughtExceptionCaptureCallback,
  loadEnvFile,
  sourceMapsEnabled,
  arch,
  argv,
  argv0,
  chdir,
  config,
  connected,
  constrainedMemory,
  availableMemory,
  cpuUsage,
  cwd,
  debugPort,
  dlopen,
  disconnect,
  emit,
  emitWarning,
  env,
  eventNames,
  execArgv,
  execPath,
  finalization,
  features,
  getActiveResourcesInfo,
  getMaxListeners,
  hrtime: hrtime3,
  kill,
  listeners,
  listenerCount,
  memoryUsage,
  on,
  off,
  once,
  pid,
  ppid,
  prependListener,
  prependOnceListener,
  rawListeners,
  release,
  removeAllListeners,
  removeListener,
  report,
  resourceUsage,
  setMaxListeners,
  setSourceMapsEnabled,
  stderr,
  stdin,
  stdout,
  title,
  throwDeprecation,
  traceDeprecation,
  umask,
  uptime,
  version,
  versions,
  domain,
  initgroups,
  moduleLoadList,
  reallyExit,
  openStdin,
  assert: assert2,
  binding,
  send,
  exitCode,
  channel,
  getegid,
  geteuid,
  getgid,
  getgroups,
  getuid,
  setegid,
  seteuid,
  setgid,
  setgroups,
  setuid,
  permission,
  mainModule,
  _events,
  _eventsCount,
  _exiting,
  _maxListeners,
  _debugEnd,
  _debugProcess,
  _fatalException,
  _getActiveHandles,
  _getActiveRequests,
  _kill,
  _preload_modules,
  _rawDebug,
  _startProfilerIdleNotifier,
  _stopProfilerIdleNotifier,
  _tickCallback,
  _disconnect,
  _handleQueue,
  _pendingMessage,
  _channel,
  _send,
  _linkedBinding
} = unenvProcess;
var _process = {
  abort,
  addListener,
  allowedNodeEnvironmentFlags,
  hasUncaughtExceptionCaptureCallback,
  setUncaughtExceptionCaptureCallback,
  loadEnvFile,
  sourceMapsEnabled,
  arch,
  argv,
  argv0,
  chdir,
  config,
  connected,
  constrainedMemory,
  availableMemory,
  cpuUsage,
  cwd,
  debugPort,
  dlopen,
  disconnect,
  emit,
  emitWarning,
  env,
  eventNames,
  execArgv,
  execPath,
  exit,
  finalization,
  features,
  getBuiltinModule,
  getActiveResourcesInfo,
  getMaxListeners,
  hrtime: hrtime3,
  kill,
  listeners,
  listenerCount,
  memoryUsage,
  nextTick,
  on,
  off,
  once,
  pid,
  platform,
  ppid,
  prependListener,
  prependOnceListener,
  rawListeners,
  release,
  removeAllListeners,
  removeListener,
  report,
  resourceUsage,
  setMaxListeners,
  setSourceMapsEnabled,
  stderr,
  stdin,
  stdout,
  title,
  throwDeprecation,
  traceDeprecation,
  umask,
  uptime,
  version,
  versions,
  // @ts-expect-error old API
  domain,
  initgroups,
  moduleLoadList,
  reallyExit,
  openStdin,
  assert: assert2,
  binding,
  send,
  exitCode,
  channel,
  getegid,
  geteuid,
  getgid,
  getgroups,
  getuid,
  setegid,
  seteuid,
  setgid,
  setgroups,
  setuid,
  permission,
  mainModule,
  _events,
  _eventsCount,
  _exiting,
  _maxListeners,
  _debugEnd,
  _debugProcess,
  _fatalException,
  _getActiveHandles,
  _getActiveRequests,
  _kill,
  _preload_modules,
  _rawDebug,
  _startProfilerIdleNotifier,
  _stopProfilerIdleNotifier,
  _tickCallback,
  _disconnect,
  _handleQueue,
  _pendingMessage,
  _channel,
  _send,
  _linkedBinding
};
var process_default = _process;

// node_modules/wrangler/_virtual_unenv_global_polyfill-@cloudflare-unenv-preset-node-process
globalThis.process = process_default;

// src/telegram.ts
var API_BASE = "https://api.telegram.org/bot";
var TgBot = class {
  token;
  base;
  constructor(token) {
    this.token = token;
    this.base = API_BASE + token;
  }
  /** 通用请求 */
  async call(method, body = {}) {
    const res = await fetch(`${this.base}/${method}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    const data = await res.json();
    if (!data.ok) {
      throw new Error(`Telegram API ${method} failed: ${data.description ?? res.status}`);
    }
    return data.result;
  }
  /** 安全版：失败不抛异常，返回 null */
  async callSafe(method, body = {}) {
    try {
      return await this.call(method, body);
    } catch {
      return null;
    }
  }
  getMe() {
    return this.call("getMe");
  }
  async setWebhook(url, secret) {
    const body = { url };
    if (secret)
      body.secret_token = secret;
    const r = await this.call("setWebhook", body);
    return r;
  }
  sendMessage(chatId, text, opts = {}) {
    return this.call("sendMessage", { chat_id: chatId, text, ...opts });
  }
  editMessageText(chatId, messageId, text, opts = {}) {
    return this.call("editMessageText", {
      chat_id: chatId,
      message_id: messageId,
      text,
      ...opts
    });
  }
  answerCallbackQuery(queryId, text, showAlert = false) {
    return this.callSafe("answerCallbackQuery", {
      callback_query_id: queryId,
      ...text ? { text } : {},
      ...showAlert ? { show_alert: true } : {}
    });
  }
  deleteMessage(chatId, messageId) {
    return this.callSafe("deleteMessage", { chat_id: chatId, message_id: messageId });
  }
  sendChatAction(chatId, action) {
    return this.callSafe("sendChatAction", { chat_id: chatId, action });
  }
  getChat(chatId) {
    return this.callSafe("getChat", {
      chat_id: chatId
    });
  }
  getChatMember(chatId, userId) {
    return this.callSafe("getChatMember", {
      chat_id: chatId,
      user_id: userId
    });
  }
};
__name(TgBot, "TgBot");
function btn(text, callback_data, url) {
  return url ? { text, url } : { text, callback_data };
}
__name(btn, "btn");

// src/env.ts
function parseAdmins(raw) {
  const set = /* @__PURE__ */ new Set();
  for (const part of (raw ?? "").split(",")) {
    const n = Number(part.trim());
    if (Number.isInteger(n) && n > 0)
      set.add(n);
  }
  return set;
}
__name(parseAdmins, "parseAdmins");
function isStaticAdmin(env2, userId) {
  if (String(env2.DEFAULT_OWNER_ID ?? "") === String(userId))
    return true;
  return parseAdmins(env2.ADMINS).has(userId);
}
__name(isStaticAdmin, "isStaticAdmin");
function tzOffsetHours(env2) {
  const n = Number(String(env2.TIME_ZONE_OFFSET_HOURS ?? ""));
  return Number.isFinite(n) ? n : 8;
}
__name(tzOffsetHours, "tzOffsetHours");

// src/ctx.ts
function makeCtx(env2, update) {
  const bot = new TgBot(env2.TELEGRAM_BOT_TOKEN);
  const msg = update.message ?? null;
  const query = update.callback_query ?? null;
  const from = msg?.from ?? query?.from ?? null;
  const chat = msg?.chat ?? query?.message?.chat ?? null;
  const text = msg?.text ?? msg?.caption ?? null;
  const isPrivate = chat?.type === "private";
  const isGroup = chat?.type === "group" || chat?.type === "supergroup";
  const userId = from?.id ?? 0;
  const isAdmin = isStaticAdmin(env2, userId);
  const isOwner = !!env2.DEFAULT_OWNER_ID && String(env2.DEFAULT_OWNER_ID) === String(userId);
  let arg = "";
  if (text && text.startsWith("/")) {
    const rest = text.slice(text.indexOf(" "));
    arg = rest.trimStart();
  }
  const reply = /* @__PURE__ */ __name(async (t, opts = {}) => {
    const kb = opts.inlineKeyboard ? { inline_keyboard: opts.inlineKeyboard } : void 0;
    const common = {
      parse_mode: opts.parseMode ?? "HTML",
      disable_web_page_preview: opts.disableWebPagePreview ?? true
    };
    if (query?.message && update.callback_query) {
      const target = query.message;
      await bot.editMessageText(target.chat.id, target.message_id, t, {
        ...common,
        ...kb ? { reply_markup: kb } : {}
      });
      return;
    }
    if (msg) {
      await bot.sendMessage(chat.id, t, {
        ...common,
        reply_to_message_id: opts.replyTo ? msg.message_id : void 0,
        ...kb ? { reply_markup: kb } : {}
      });
      return;
    }
    await bot.sendMessage(chat.id, t, { ...common, ...kb ? { reply_markup: kb } : {} });
  }, "reply");
  const sendTo = /* @__PURE__ */ __name(async (chatId, t, opts = {}) => {
    const kb = opts.inlineKeyboard ? { inline_keyboard: opts.inlineKeyboard } : void 0;
    await bot.sendMessage(chatId, t, {
      parse_mode: opts.parseMode ?? "HTML",
      disable_web_page_preview: opts.disableWebPagePreview ?? true,
      ...kb ? { reply_markup: kb } : {}
    });
  }, "sendTo");
  const answer = /* @__PURE__ */ __name(async (t, alert = false) => {
    if (query)
      await bot.answerCallbackQuery(query.id, t, alert);
  }, "answer");
  const keypad = /* @__PURE__ */ __name(async (t, lines, parseMode) => {
    await reply(t, { inlineKeyboard: lines, parseMode });
  }, "keypad");
  return {
    env: env2,
    bot,
    update,
    from,
    chat,
    message: msg,
    query,
    text,
    arg,
    isPrivate,
    isGroup,
    isAdmin,
    isOwner,
    reply,
    sendTo,
    answer,
    keypad
  };
}
__name(makeCtx, "makeCtx");

// src/db.ts
async function ensureUser(db, user, chatId) {
  const now = (/* @__PURE__ */ new Date()).toISOString().slice(0, 19).replace("T", " ");
  const existing = await getUser(db, user.id);
  if (existing) {
    await db.prepare(
      `UPDATE users SET
           username = ?, first_name = ?, last_name = ?, language_code = ?,
           chat_id = COALESCE(?, chat_id), last_active_at = ?
         WHERE id = ?`
    ).bind(user.username ?? null, user.first_name, user.last_name ?? null, user.language_code ?? null, chatId ?? null, now, user.id).run();
    return await getUser(db, user.id);
  }
  await db.prepare(
    `INSERT INTO users (id, username, first_name, last_name, language_code, chat_id, created_at, last_active_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(user.id, user.username ?? null, user.first_name, user.last_name ?? null, user.language_code ?? null, chatId ?? null, now, now).run();
  return await getUser(db, user.id);
}
__name(ensureUser, "ensureUser");
async function getUser(db, id) {
  const row = await db.prepare("SELECT * FROM users WHERE id = ?").bind(id).first();
  return row ?? null;
}
__name(getUser, "getUser");
async function addPoints(db, id, delta) {
  await db.prepare(
    `UPDATE users SET points = MAX(0, points + ?),
        updated_at = strftime('%Y-%m-%d %H:%M:%S','now') WHERE id = ?`
  ).bind(delta, id).run();
  return await getUser(db, id);
}
__name(addPoints, "addPoints");
async function getUserRank(db, id) {
  const row = await db.prepare("SELECT COUNT(*) AS rank FROM users WHERE points > (SELECT points FROM users WHERE id = ?)").bind(id).first();
  return (row?.rank ?? 0) + 1;
}
__name(getUserRank, "getUserRank");
async function getTop(db, limit) {
  const res = await db.prepare("SELECT * FROM users ORDER BY points DESC, total_checkins DESC LIMIT ?").bind(limit).all();
  return res.results ?? [];
}
__name(getTop, "getTop");
async function hasCheckedToday(db, userId, date) {
  const row = await db.prepare("SELECT id FROM checkins WHERE user_id = ? AND date = ?").bind(userId, date).first();
  return !!row;
}
__name(hasCheckedToday, "hasCheckedToday");
async function dbDoCheckin(db, userId, date, baseReward) {
  if (await hasCheckedToday(db, userId, date)) {
    return { points: 0, streak: await getCurrentStreak(db, userId), bonus: 0, firstTime: false };
  }
  const prevStreak = await getCurrentStreak(db, userId);
  const streak = prevStreak + 1;
  await db.prepare("INSERT INTO checkins (user_id, date, points, streak) VALUES (?, ?, ?, ?)").bind(userId, date, baseReward, streak).run();
  await db.prepare(
    `UPDATE users SET points = points + ?, total_checkins = total_checkins + 1,
        updated_at = strftime('%Y-%m-%d %H:%M:%S','now') WHERE id = ?`
  ).bind(baseReward, userId).run();
  return { points: baseReward, streak, bonus: 0, firstTime: true };
}
__name(dbDoCheckin, "dbDoCheckin");
async function getCurrentStreak(db, userId) {
  const ONE_DAY = 864e5;
  const today = /* @__PURE__ */ new Date();
  const res = await db.prepare("SELECT date FROM checkins WHERE user_id = ? ORDER BY date DESC LIMIT 60").bind(userId).all();
  const dates = new Set((res.results ?? []).map((r) => r.date));
  let cursor = today;
  if (!dates.has(localDate(cursor)))
    cursor = new Date(today.getTime() - ONE_DAY);
  let streak = 0;
  for (let i = 0; i < 60; i++) {
    if (dates.has(localDate(cursor))) {
      streak++;
      cursor = new Date(cursor.getTime() - ONE_DAY);
    } else
      break;
  }
  return streak;
}
__name(getCurrentStreak, "getCurrentStreak");
function localDate(d = /* @__PURE__ */ new Date(), tzOffsetHours2 = 8) {
  return new Date(d.getTime() + tzOffsetHours2 * 36e5).toISOString().slice(0, 10);
}
__name(localDate, "localDate");
async function getInviter(db, invitedId) {
  const row = await db.prepare("SELECT inviter_id FROM invites WHERE invited_id = ?").bind(invitedId).first();
  return row?.inviter_id ?? null;
}
__name(getInviter, "getInviter");
async function registerInvite(db, inviterId, invitedId, invitedReward, inviterReward) {
  if (inviterId === invitedId)
    return "self";
  if (await getInviter(db, invitedId) !== null)
    return "exists";
  const inviter = await getUser(db, inviterId);
  if (!inviter || inviter.is_banned)
    return "exists";
  await db.batch([
    db.prepare("INSERT INTO invites (inviter_id, invited_id, reward_inviter, reward_invited) VALUES (?, ?, ?, ?)").bind(inviterId, invitedId, inviterReward, invitedReward),
    db.prepare("UPDATE users SET points = points + ?, inviter_id = ? WHERE id = ?").bind(invitedReward, inviterId, invitedId),
    db.prepare("UPDATE users SET points = points + ?, total_invites = total_invites + 1 WHERE id = ?").bind(inviterReward, inviterId)
  ]);
  return "ok";
}
__name(registerInvite, "registerInvite");
async function createOrder(db, orderNo, amount, createdBy) {
  await db.prepare("INSERT INTO orders (order_no, item_type, amount, status, created_by) VALUES (?, 'points', ?, 'unused', ?)").bind(orderNo, amount, createdBy).run();
}
__name(createOrder, "createOrder");
async function redeemOrder(db, userId, orderNo) {
  const order = await db.prepare("SELECT * FROM orders WHERE order_no = ?").bind(orderNo.trim().toUpperCase()).first();
  if (!order)
    return "invalid";
  if (order.status !== "unused")
    return "used";
  await db.batch([
    db.prepare("UPDATE orders SET status = 'used', user_id = ?, used_at = strftime('%Y-%m-%d %H:%M:%S','now') WHERE id = ?").bind(userId, order.id),
    db.prepare("UPDATE users SET points = points + ? WHERE id = ?").bind(order.amount, userId)
  ]);
  return "ok";
}
__name(redeemOrder, "redeemOrder");
async function listTutorialCategories(db) {
  const res = await db.prepare("SELECT DISTINCT category FROM tutorials WHERE published = 1 ORDER BY category").all();
  return (res.results ?? []).map((r) => r.category);
}
__name(listTutorialCategories, "listTutorialCategories");
async function listTutorials(db, category) {
  const q = category ? "SELECT * FROM tutorials WHERE published = 1 AND category = ? ORDER BY id DESC" : "SELECT * FROM tutorials WHERE published = 1 ORDER BY id DESC";
  const res = await db.prepare(q).bind(category ?? null).all();
  return res.results ?? [];
}
__name(listTutorials, "listTutorials");
async function getTutorial(db, id) {
  const row = await db.prepare("SELECT * FROM tutorials WHERE id = ?").bind(id).first();
  if (row && row.published === 1) {
    await db.prepare("UPDATE tutorials SET view_count = view_count + 1 WHERE id = ?").bind(id).run();
  }
  return row ?? null;
}
__name(getTutorial, "getTutorial");
async function addTutorial(db, t) {
  await db.prepare("INSERT INTO tutorials (title, category, summary, content, tags, author_id) VALUES (?, ?, ?, ?, ?, ?)").bind(t.title, t.category, t.summary ?? "", t.content, t.tags ?? "", t.authorId ?? null).run();
}
__name(addTutorial, "addTutorial");
async function ban(db, targetType, targetId, reason, byId) {
  await db.prepare("INSERT OR IGNORE INTO blacklist (target_type, target_id, reason, created_by) VALUES (?, ?, ?, ?)").bind(targetType, targetId, reason, byId).run();
  if (targetType === "user") {
    await db.prepare("UPDATE users SET is_banned = 1 WHERE id = ?").bind(targetId).run();
  }
}
__name(ban, "ban");
async function unban(db, targetType, targetId) {
  await db.prepare("DELETE FROM blacklist WHERE target_type = ? AND target_id = ?").bind(targetType, targetId).run();
  if (targetType === "user") {
    await db.prepare("UPDATE users SET is_banned = 0 WHERE id = ?").bind(targetId).run();
  }
}
__name(unban, "unban");
async function getStats(db) {
  const users = await db.prepare("SELECT COUNT(*) AS n, SUM(points) AS pts FROM users").first();
  const today = await db.prepare("SELECT COUNT(DISTINCT user_id) AS n FROM checkins WHERE date = date('now')").first();
  const orders = await db.prepare("SELECT COUNT(*) AS n, COALESCE(SUM(amount), 0) AS amt FROM orders WHERE status = 'unused'").first();
  return {
    users: users?.n ?? 0,
    points: users?.pts ?? 0,
    todayCheckins: today?.n ?? 0,
    unusedOrders: orders?.n ?? 0,
    unusedPoints: orders?.amt ?? 0
  };
}
__name(getStats, "getStats");

// src/middleware.ts
async function rateLimit(env2, scope, key, limit, windowSec) {
  if (limit <= 0)
    return true;
  const k = `rl:${scope}:${key}`;
  try {
    const raw = await env2.KV.get(k);
    const now = Math.floor(Date.now() / 1e3);
    if (!raw) {
      await env2.KV.put(k, `${now}|1`, { expirationTtl: windowSec });
      return true;
    }
    const [startStr, countStr] = raw.split("|");
    const start = Number(startStr);
    const count3 = Number(countStr);
    if (now - start >= windowSec) {
      await env2.KV.put(k, `${now}|1`, { expirationTtl: windowSec });
      return true;
    }
    if (count3 >= limit)
      return false;
    await env2.KV.put(k, `${start}|${count3 + 1}`, { expirationTtl: windowSec - (now - start) });
    return true;
  } catch {
    return true;
  }
}
__name(rateLimit, "rateLimit");
async function isUserBanned(env2, userId) {
  const k = `ban:user:${userId}`;
  try {
    const cached = await env2.KV.get(k);
    if (cached !== null)
      return cached === "1";
  } catch {
  }
  const row = await env2.DB.prepare("SELECT id FROM blacklist WHERE target_type = ? AND target_id = ?").bind("user", userId).first();
  const banned = !!row;
  try {
    await env2.KV.put(k, banned ? "1" : "0", { expirationTtl: 300 });
  } catch {
  }
  return banned;
}
__name(isUserBanned, "isUserBanned");
async function isChatBanned(env2, chatId) {
  const row = await env2.DB.prepare("SELECT id FROM blacklist WHERE target_type = ? AND target_id = ?").bind("chat", chatId).first();
  return !!row;
}
__name(isChatBanned, "isChatBanned");
async function checkBanStatus(env2, user, chat) {
  if (user && await isUserBanned(env2, user.id))
    return "\u4F60\u5DF2\u88AB\u52A0\u5165\u9ED1\u540D\u5355\uFF0C\u65E0\u6CD5\u4F7F\u7528\u673A\u5668\u4EBA\u3002";
  if (chat && chat.type !== "private" && await isChatBanned(env2, chat.id))
    return "\u672C\u7FA4\u5DF2\u88AB\u7BA1\u7406\u5458\u7981\u6B62\u4F7F\u7528\u673A\u5668\u4EBA\u3002";
  return null;
}
__name(checkBanStatus, "checkBanStatus");

// src/config.ts
var DEFAULT_CONFIG = {
  brand: {
    name: "\u6570\u7801\u89E3\u7801\u5DE5\u5177\u7AD9",
    pointsName: "\u89E3\u7801\u70B9",
    greeting: "\u6B22\u8FCE\u6765\u5230\u6570\u7801\u89E3\u7801\u5DE5\u5177\u7AD9"
  },
  welcome: {
    enabled: true,
    text: "\u{1F389} \u6B22\u8FCE {name} \u52A0\u5165 {chat}\uFF01\n\n\u{1F6E0} \u672C\u7AD9\u63D0\u4F9B IP \u67E5\u8BE2 / DNS \u89E3\u6790 / Ping \u68C0\u6D4B / Base64 / JSON \u89E3\u7801\u7B49\u5B9E\u7528\u5DE5\u5177\uFF0C\n\u5E76\u652F\u6301\u5C06\u89E3\u7801\u70B9\u5151\u6362\u4E3A\u5DE5\u5177\u65F6\u957F\u4E0E\u9AD8\u7EA7\u670D\u52A1\u6B21\u6570\u3002\n\n\u{1F4B0} \u6BCF\u65E5\u7B7E\u5230\u3001\u9080\u8BF7\u597D\u53CB\u5373\u53EF\u83B7\u5F97\u89E3\u7801\u70B9\u3002\n\u{1F4CC} \u56DE\u590D /help \u6216\u70B9\u51FB\u4E0B\u65B9\u83DC\u5355\u5F00\u59CB\u4F7F\u7528\u3002",
    deleteSystemMessages: true
  },
  faq: [
    {
      id: "faq_how_start",
      keywords: ["\u600E\u4E48\u5F00\u59CB", "\u5982\u4F55\u4F7F\u7528", "\u5DE5\u5177\u5728\u54EA", "\u5DE5\u5177\u600E\u4E48\u7528", "\u65B0\u624B"],
      mode: "includes",
      reply: "\u{1F4CC} \u4F7F\u7528\u6307\u5357\uFF1A\n1\uFE0F\u20E3 \u53D1\u9001 /tools \u6253\u5F00\u5DE5\u5177\u7BB1\uFF08IP/DNS/Ping/Base64/JSON\uFF09\n2\uFE0F\u20E3 \u53D1\u9001 /checkin \u6BCF\u65E5\u7B7E\u5230\u9886\u89E3\u7801\u70B9\n3\uFE0F\u20E3 \u53D1\u9001 /me \u67E5\u770B\u89E3\u7801\u70B9\u4F59\u989D\n4\uFE0F\u20E3 \u9AD8\u7EA7\u670D\u52A1\u4E0E\u65F6\u957F\u5151\u6362\u8BF7\u5728\u7FA4\u5185\u67E5\u770B\u5151\u6362\u8BF4\u660E"
    },
    {
      id: "faq_points",
      keywords: ["\u89E3\u7801\u70B9", "\u79EF\u5206\u600E\u4E48\u6765", "\u79EF\u5206\u6709\u4EC0\u4E48\u7528", "\u5982\u4F55\u8D5A\u79EF\u5206", "\u70B9\u600E\u4E48\u83B7\u5F97"],
      mode: "includes",
      reply: "\u{1F48E} \u89E3\u7801\u70B9\u662F\u672C\u7AD9\u670D\u52A1\u8D27\u5E01\uFF1A\n\u30FB\u6BCF\u65E5\u7B7E\u5230\uFF1A+8 \u89E3\u7801\u70B9\n\u30FB\u8FDE\u7EED\u7B7E\u5230\uFF1A\u7B2C 7/14/30 \u5929\u6709\u91CC\u7A0B\u7891\u5956\u52B1\n\u30FB\u9080\u8BF7\u597D\u53CB\uFF1A\u53CC\u65B9\u5404\u5F97\u5956\u52B1\n\n\u89E3\u7801\u70B9\u53EF\u7528\u4E8E\u5151\u6362 \u5DE5\u5177\u4F7F\u7528\u65F6\u957F / \u9AD8\u7EA7\u670D\u52A1\u6B21\u6570 / \u4F1A\u5458\u7279\u6743\uFF0C\u53D1\u9001 /me \u67E5\u770B\u4F59\u989D\u3002"
    },
    {
      id: "faq_checkin",
      keywords: ["\u7B7E\u5230", "\u6253\u5361", "\u6BCF\u65E5\u7B7E\u5230"],
      mode: "includes",
      reply: "\u{1F4DD} \u53D1\u9001 /checkin \u5373\u53EF\u6BCF\u65E5\u7B7E\u5230\uFF01\n\u30FB\u6BCF\u65E5\u57FA\u7840 +8 \u89E3\u7801\u70B9\n\u30FB\u8FDE\u7EED 7 \u5929 +30\u300114 \u5929 +60\u300130 \u5929 +150\uFF08\u5F53\u5929\u989D\u5916\u53D1\u653E\uFF09\n\u575A\u6301\u8D8A\u4E45\u5956\u52B1\u8D8A\u591A\u54E6\uFF01"
    },
    {
      id: "faq_invite",
      keywords: ["\u9080\u8BF7", "\u62C9\u4EBA", "\u9080\u8BF7\u597D\u53CB", "\u88C2\u53D8"],
      mode: "includes",
      reply: "\u{1F381} \u53D1\u9001 /invite \u83B7\u53D6\u4F60\u7684\u4E13\u5C5E\u9080\u8BF7\u94FE\u63A5\u3002\n\u597D\u53CB\u901A\u8FC7\u94FE\u63A5\u6CE8\u518C\uFF1A\u597D\u53CB +20 \u89E3\u7801\u70B9\uFF0C\u4F60 +35 \u89E3\u7801\u70B9\u3002\n\u9080\u8BF7\u8D8A\u591A\uFF0C\u89E3\u9501\u7684\u5DE5\u5177\u65F6\u957F\u8D8A\u591A\uFF01"
    },
    {
      id: "faq_tools",
      keywords: ["ip", "dns", "ping", "base64", "json", "\u89E3\u7801\u5DE5\u5177", "\u5DE5\u5177"],
      mode: "includes",
      reply: '\u{1F9F0} \u5DE5\u5177\u7BB1\u652F\u6301\uFF1A\n\u30FBIP \u5F52\u5C5E\u67E5\u8BE2 \u2192 /ip\n\u30FBDNS \u89E3\u6790 \u2192 /dns \u57DF\u540D AAAA\n\u30FBPing \u5EF6\u8FDF\u68C0\u6D4B \u2192 /ping \u57DF\u540D\n\u30FBBase64 \u7F16\u89E3\u7801 \u2192 /b64 encode \u6587\u672C\n\u30FBJSON \u683C\u5F0F\u5316 \u2192 /json {"a":1}\n\n\u76F4\u63A5\u53D1\u9001 /tools \u6253\u5F00\u9762\u677F\u66F4\u65B9\u4FBF\uFF01'
    },
    {
      id: "faq_redeem",
      keywords: ["\u5151\u6362", "\u5151\u6362\u7801", "\u5361\u5BC6", "\u5145\u503C"],
      mode: "includes",
      reply: "\u{1F39F} \u5728\u7BA1\u7406\u5458\u5904\u8D2D\u4E70/\u9886\u53D6\u5151\u6362\u7801\u540E\uFF0C\u79C1\u804A\u53D1\u9001\uFF1A\n<code>/redeem \u5151\u6362\u7801</code>\n\u5373\u53EF\u5151\u6362\u5BF9\u5E94\u9762\u503C\u7684\u89E3\u7801\u70B9\uFF0C\u7528\u4E8E\u89E3\u9501\u5DE5\u5177\u65F6\u957F\u4E0E\u670D\u52A1\u3002"
    },
    {
      id: "faq_hello",
      keywords: ["\u4F60\u597D", "\u60A8\u597D", "hi", "hello", "\u5728\u5417"],
      mode: "exact",
      reply: "\u4F60\u597D\u5440\uFF01\u8FD9\u91CC\u662F\u6570\u7801\u89E3\u7801\u5DE5\u5177\u7AD9 \u{1F916} \u53D1\u9001 /help \u67E5\u770B\u5168\u90E8\u529F\u80FD\u3002"
    }
  ],
  checkin: {
    enabled: true,
    rewardPoints: 8,
    streakBonuses: [
      { days: 7, points: 30 },
      { days: 14, points: 60 },
      { days: 30, points: 150 }
    ]
  },
  invite: {
    invitedReward: 20,
    inviterReward: 35
  },
  top: {
    limit: 10
  },
  ai: {
    enabled: true,
    model: "@cf/meta/llama-3.1-8b-instruct",
    maxTokens: 512,
    promptSystem: '\u4F60\u662F"\u6570\u7801\u89E3\u7801\u5DE5\u5177\u7AD9"\u7684\u667A\u80FD\u52A9\u624B\uFF0C\u719F\u6089 IP/DNS/Ping \u68C0\u6D4B\u3001Base64/JSON \u89E3\u7801\u7B49\u7F51\u7EDC\u5DE5\u5177\u7684\u4F7F\u7528\u65B9\u6CD5\uFF0C\u4E5F\u80FD\u89E3\u7B54\u89E3\u7801\u70B9\u83B7\u53D6\u4E0E\u5151\u6362\u89C4\u5219\u3002\u56DE\u7B54\u4F7F\u7528\u7B80\u4F53\u4E2D\u6587\uFF0C\u7B80\u6D01\u4E13\u4E1A\uFF0C\u6D89\u53CA\u5177\u4F53\u547D\u4EE4\u65F6\u7ED9\u51FA\u53EF\u7528\u547D\u4EE4\u3002',
    rateLimitPerMin: 8
  },
  tools: {
    enabled: ["base64", "json", "dns", "ping", "ip", "deco"]
  },
  limits: {
    maxTextLen: 2e3
  }
};
var CONFIG_KV_KEY = "bot:config:v1";
function isPlainObject(v) {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}
__name(isPlainObject, "isPlainObject");
function deepMerge(base, overlay) {
  if (!isPlainObject(base) || !isPlainObject(overlay)) {
    return overlay === void 0 ? base : overlay;
  }
  const out = { ...base };
  for (const key of Object.keys(overlay)) {
    out[key] = deepMerge(out[key], overlay[key]);
  }
  return out;
}
__name(deepMerge, "deepMerge");
async function getConfig(env2) {
  try {
    const raw = await env2.KV.get(CONFIG_KV_KEY);
    if (raw) {
      try {
        const overlay = JSON.parse(raw);
        return deepMerge(DEFAULT_CONFIG, overlay);
      } catch {
      }
    }
  } catch {
  }
  return DEFAULT_CONFIG;
}
__name(getConfig, "getConfig");
async function setConfigOverlay(env2, overlay) {
  await env2.KV.put(CONFIG_KV_KEY, JSON.stringify(overlay));
}
__name(setConfigOverlay, "setConfigOverlay");
async function resetConfig(env2) {
  await env2.KV.delete(CONFIG_KV_KEY);
}
__name(resetConfig, "resetConfig");

// src/utils/text.ts
function splitLong(text, max = 4e3) {
  if (text.length <= max)
    return [text];
  const parts = [];
  let rest = text;
  while (rest.length > max) {
    let cut = rest.lastIndexOf("\n", max);
    if (cut <= 0)
      cut = max;
    parts.push(rest.slice(0, cut));
    rest = rest.slice(cut).replace(/^\n/, "");
  }
  if (rest)
    parts.push(rest);
  return parts;
}
__name(splitLong, "splitLong");
function esc(text) {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
__name(esc, "esc");
function displayName(user) {
  if (!user)
    return "\u672A\u77E5\u7528\u6237";
  if (user.username)
    return `@${user.username}`;
  return user.first_name || "\u7528\u6237";
}
__name(displayName, "displayName");
function mention(user) {
  if (user.username)
    return `@${user.username}`;
  const name = esc(user.first_name || "\u7528\u6237");
  return `<a href="tg://user?id=${user.id}">${name}</a>`;
}
__name(mention, "mention");
function fmt(n) {
  return n.toLocaleString("en-US");
}
__name(fmt, "fmt");
function trunc(text, len = 200) {
  return text.length > len ? text.slice(0, len) + "\u2026" : text;
}
__name(trunc, "trunc");

// src/handlers/checkin.ts
async function doCheckin(ctx) {
  if (!ctx.from || !ctx.chat)
    return;
  if (!ctx.isPrivate) {
    await ctx.reply("\u{1F4A1} \u7B7E\u5230\u8BF7\u5728\u79C1\u804A\u4E2D\u5B8C\u6210\u54E6\uFF08\u53D1\u9001 /checkin\uFF09\u3002");
    return;
  }
  const cfg = await getConfig(ctx.env);
  if (!cfg.checkin.enabled) {
    await ctx.reply("\u7B7E\u5230\u529F\u80FD\u6682\u65F6\u5173\u95ED\uFF0C\u656C\u8BF7\u671F\u5F85\u3002");
    return;
  }
  const tz = tzOffsetHours(ctx.env);
  const date = localDate(/* @__PURE__ */ new Date(), tz);
  const res = await dbDoCheckin(ctx.env.DB, ctx.from.id, date, cfg.checkin.rewardPoints);
  if (!res.firstTime) {
    const user2 = await getUser(ctx.env.DB, ctx.from.id);
    await ctx.reply(
      `\u{1F634} \u4ECA\u5929\u5DF2\u7ECF\u7B7E\u5230\u8FC7\u4E86\u54E6\uFF08\u5DF2\u8FDE\u7EED <b>${res.streak}</b> \u5929\uFF09
\u660E\u5929\u518D\u6765\u5427\uFF5E \u5F53\u524D${cfg.brand.pointsName}\uFF1A<b>${fmt(user2?.points ?? 0)}</b>`,
      { inlineKeyboard: [[btn("\u2B05 \u8FD4\u56DE\u4E3B\u83DC\u5355", "menu:main")]] }
    );
    return;
  }
  let bonus = 0;
  let milestoneDays = 0;
  for (const sb of cfg.checkin.streakBonuses) {
    if (res.streak === sb.days) {
      bonus = sb.points;
      milestoneDays = sb.days;
      break;
    }
  }
  if (bonus > 0) {
    await addPoints(ctx.env.DB, ctx.from.id, bonus);
  }
  const user = await getUser(ctx.env.DB, ctx.from.id);
  const nextBonus = cfg.checkin.streakBonuses.find((sb) => sb.days > res.streak);
  const text = [
    `\u2705 \u7B7E\u5230\u6210\u529F\uFF01`,
    ``,
    `\u{1F525} \u5DF2\u8FDE\u7EED\u7B7E\u5230 <b>${res.streak}</b> \u5929`,
    `\u{1F4B0} \u83B7\u5F97 ${cfg.brand.pointsName}\uFF1A<b>+${res.points}</b>${bonus ? `\u3000\u{1F381} \u91CC\u7A0B\u7891\u5956\u52B1 <b>+${bonus}</b>` : ""}`,
    `\u{1F4CA} \u5F53\u524D${cfg.brand.pointsName}\uFF1A<b>${fmt(user?.points ?? 0)}</b>`,
    bonus ? `
\u{1F389} \u606D\u559C\u8FBE\u6210\u8FDE\u7EED ${milestoneDays} \u5929\u91CC\u7A0B\u7891\uFF0C\u989D\u5916\u83B7\u5F97 ${bonus} ${cfg.brand.pointsName}\uFF01` : nextBonus ? `
\u7EE7\u7EED\u575A\u6301\uFF0C\u8FDE\u7EED ${nextBonus.days} \u5929\u53EF\u518D\u9886 ${nextBonus.points} ${cfg.brand.pointsName}\uFF01` : `
\u5DF2\u8FBE\u6210\u5168\u90E8\u7B7E\u5230\u91CC\u7A0B\u7891\uFF0C\u7EE7\u7EED\u4FDD\u6301\u597D\u4E60\u60EF\uFF01`
  ].join("\n");
  await ctx.reply(text, { inlineKeyboard: [[btn("\u2B05 \u8FD4\u56DE\u4E3B\u83DC\u5355", "menu:main")]] });
}
__name(doCheckin, "doCheckin");

// src/handlers/points.ts
async function cmdMe(ctx) {
  if (!ctx.from)
    return;
  const cfg = await getConfig(ctx.env);
  const [user, rank] = await Promise.all([
    getUser(ctx.env.DB, ctx.from.id),
    getUserRank(ctx.env.DB, ctx.from.id)
  ]);
  if (!user) {
    await ctx.reply("\u8BF7\u5148\u53D1\u9001 /start \u6CE8\u518C\u3002");
    return;
  }
  const pname = cfg.brand.pointsName;
  const preset = ctx.isOwner ? "\u{1F451} \u7FA4\u4E3B" : "";
  const text = [
    `\u{1F464} <b>${esc(user.first_name ?? "")}</b>${user.username ? ` (@${esc(user.username)})` : ""} ${preset}`,
    ``,
    `\u{1F4B0} \u5F53\u524D${pname}\uFF1A<b>${fmt(user.points)}</b>`,
    `\u{1F3C5} \u5168\u7AD9\u6392\u884C\uFF1A<b>#${fmt(rank)}</b>`,
    `\u{1F4CC} \u7D2F\u8BA1\u7B7E\u5230\uFF1A<b>${fmt(user.total_checkins)}</b> \u5929`,
    `\u{1F465} \u7D2F\u8BA1\u9080\u8BF7\uFF1A<b>${fmt(user.total_invites)}</b> \u4EBA`,
    `\u{1F5D3}\uFE0F \u6CE8\u518C\u65F6\u95F4\uFF1A${user.created_at}`
  ].join("\n");
  await ctx.reply(text, {
    inlineKeyboard: [
      [btn("\u{1F4DD} \u7B7E\u5230", "ck:do"), btn("\u{1F525} \u6392\u884C\u699C", "pt:top")],
      [btn("\u2B05 \u8FD4\u56DE\u4E3B\u83DC\u5355", "menu:main")]
    ]
  });
}
__name(cmdMe, "cmdMe");
async function cmdTop(ctx) {
  const cfg = await getConfig(ctx.env);
  const rows = await getTop(ctx.env.DB, cfg.top.limit);
  if (rows.length === 0) {
    await ctx.reply("\u6682\u65E0\u7528\u6237\u6570\u636E\uFF0C\u5FEB\u53BB\u9080\u8BF7\u670B\u53CB\u6765\u73A9\u5427\uFF01", {
      inlineKeyboard: [[btn("\u2B05 \u8FD4\u56DE\u4E3B\u83DC\u5355", "menu:main")]]
    });
    return;
  }
  const medals = ["\u{1F947}", "\u{1F948}", "\u{1F949}"];
  const lines = rows.map((u, i) => {
    const medal = medals[i] ?? `${i + 1}.`;
    const name = u.username ? `@${esc(u.username)}` : esc(u.first_name ?? "\u7528\u6237");
    const flam = !!ctx.from && u.id === ctx.from.id;
    const mark = flam ? " \u25C0\uFE0F" : "";
    return `${medal} <b>${name}</b>${mark}
\u3000\u{1F4B0} ${fmt(u.points)} ${cfg.brand.pointsName} \xB7 \u7B7E\u5230 ${fmt(u.total_checkins)} \u5929`;
  });
  const self = ctx.from ? await getUser(ctx.env.DB, ctx.from.id) : null;
  const selfRank = ctx.from ? await getUserRank(ctx.env.DB, ctx.from.id) : 0;
  const text = [
    `\u{1F525} <b>${cfg.brand.pointsName}\u6392\u884C\u699C TOP ${cfg.top.limit}</b>`,
    ``,
    ...lines,
    self ? `
\u2026\u2026
\u4F60\u7684\u6392\u540D\uFF1A<b>#${fmt(selfRank)}</b>\uFF08${fmt(self.points)} ${cfg.brand.pointsName}\uFF09` : ""
  ].join("\n");
  await ctx.reply(text, {
    inlineKeyboard: [[btn("\u{1F504} \u5237\u65B0", "pt:top"), btn("\u2B05 \u8FD4\u56DE\u4E3B\u83DC\u5355", "menu:main")]]
  });
}
__name(cmdTop, "cmdTop");
async function cmdInvite(ctx) {
  const cfg = await getConfig(ctx.env);
  const username = ctx.env.TELEGRAM_BOT_USERNAME;
  if (!username) {
    await ctx.reply("\u673A\u5668\u4EBA\u7528\u6237\u540D\u5C1A\u672A\u914D\u7F6E\uFF0C\u8BF7\u8054\u7CFB\u7BA1\u7406\u5458\u3002");
    return;
  }
  const link = `https://t.me/${username}?start=ref_${ctx.from.id}`;
  const text = [
    `\u{1F381} <b>\u9080\u8BF7\u597D\u53CB\u8D5A${cfg.brand.pointsName}</b>`,
    ``,
    `\u9080\u8BF7\u65B0\u7528\u6237\u901A\u8FC7\u4F60\u7684\u94FE\u63A5\u6CE8\u518C\uFF0C\u53CC\u65B9\u90FD\u6709\u5956\u52B1\uFF1A`,
    `\u3000\u2705 \u88AB\u9080\u8BF7\u4EBA\uFF1A+${cfg.invite.invitedReward}`,
    `\u3000\u2705 \u9080\u8BF7\u4EBA\uFF1A+${cfg.invite.inviterReward}`,
    ``,
    `\u{1F447} \u4F60\u7684\u4E13\u5C5E\u9080\u8BF7\u94FE\u63A5\uFF08\u70B9\u51FB\u590D\u5236\uFF09\uFF1A`,
    `<code>${link}</code>`
  ].join("\n");
  await ctx.reply(text, {
    inlineKeyboard: [[btn("\u2B05 \u8FD4\u56DE\u4E3B\u83DC\u5355", "menu:main")]]
  });
}
__name(cmdInvite, "cmdInvite");
async function cmdRedeem(ctx) {
  if (!ctx.from)
    return;
  const code = ctx.arg.trim();
  if (!code) {
    await ctx.reply("\u7528\u6CD5\uFF1A/redeem <\u5151\u6362\u7801>\n\u5728\u7BA1\u7406\u5458\u5904\u83B7\u5F97\u5151\u6362\u7801\u540E\u4F7F\u7528\u3002");
    return;
  }
  const cfg = await getConfig(ctx.env);
  const result = await redeemOrder(ctx.env.DB, ctx.from.id, code);
  const user = await getUser(ctx.env.DB, ctx.from.id);
  if (result === "ok") {
    await ctx.reply(`\u2705 \u5151\u6362\u6210\u529F\uFF01
\u5F53\u524D${cfg.brand.pointsName}\uFF1A<b>${fmt(user?.points ?? 0)}</b>`);
  } else if (result === "used") {
    await ctx.reply("\u8BE5\u5151\u6362\u7801\u5DF2\u88AB\u4F7F\u7528\uFF0C\u8BF7\u52FF\u91CD\u590D\u5151\u6362\u3002");
  } else {
    await ctx.reply("\u5151\u6362\u7801\u4E0D\u5B58\u5728\u6216\u5DF2\u5931\u6548\u3002");
  }
}
__name(cmdRedeem, "cmdRedeem");

// src/utils/network.ts
function b64Encode(text) {
  return btoa(new TextEncoder().encode(text).reduce((s, b) => s + String.fromCharCode(b), ""));
}
__name(b64Encode, "b64Encode");
function b64Decode(text) {
  try {
    const bin = atob(text.trim());
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++)
      bytes[i] = bin.charCodeAt(i);
    return new TextDecoder().decode(bytes);
  } catch {
    throw new Error("Base64 \u89E3\u7801\u5931\u8D25\uFF1A\u5185\u5BB9\u4E0D\u662F\u5408\u6CD5\u7684 Base64 \u6216\u5305\u542B\u975E UTF-8 \u6570\u636E");
  }
}
__name(b64Decode, "b64Decode");
function jsonBeautify(text) {
  const obj = JSON.parse(text);
  return JSON.stringify(obj, null, 2);
}
__name(jsonBeautify, "jsonBeautify");
function jsonMinify(text) {
  return JSON.stringify(JSON.parse(text));
}
__name(jsonMinify, "jsonMinify");
async function dnsQuery(domain2, type = "A") {
  const url = `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(domain2)}&type=${encodeURIComponent(type)}`;
  const res = await fetch(url, {
    headers: { accept: "application/dns-json" }
  });
  if (!res.ok)
    throw new Error(`DNS \u67E5\u8BE2\u5931\u8D25\uFF08HTTP ${res.status}\uFF09`);
  const data = await res.json();
  if (data.Status !== 0)
    throw new Error(`DNS \u8FD4\u56DE\u5F02\u5E38\u72B6\u6001\u7801 ${data.Status}${data.Comment ? `\uFF08${data.Comment}\uFF09` : ""}`);
  if (!data.Answer || data.Answer.length === 0)
    throw new Error("\u672A\u67E5\u8BE2\u5230\u8BB0\u5F55");
  return data.Answer;
}
__name(dnsQuery, "dnsQuery");
async function pingHost(raw) {
  let host = raw.trim().replace(/^https?:\/\//i, "").split("/")[0].split(":")[0];
  if (!host)
    throw new Error("\u8BF7\u8F93\u5165\u8981\u68C0\u6D4B\u7684\u4E3B\u673A\u540D");
  const start = Date.now();
  try {
    const res = await fetch(`https://${host}/`, {
      cf: { cacheTtl: 0, cacheEverything: false }
    });
    return {
      host,
      httpStatus: res.status,
      latencyMs: Date.now() - start,
      colo: res.headers.get("cf-ray") != null ? "CF" : void 0
    };
  } catch {
    return { host, httpStatus: null, latencyMs: Date.now() - start };
  }
}
__name(pingHost, "pingHost");
async function queryIp(ip) {
  const res = await fetch("https://1.0.0.1/cdn-cgi/trace");
  const text = await res.text();
  const map = /* @__PURE__ */ new Map();
  for (const line of text.split("\n")) {
    const idx = line.indexOf("=");
    if (idx > 0)
      map.set(line.slice(0, idx), line.slice(idx + 1));
  }
  return {
    ip: map.get("ip") ?? "\u672A\u77E5",
    loc: map.get("loc") ?? null,
    colo: map.get("colo") ?? null,
    asn: map.get("asn") ?? null,
    uag: map.get("uag") ?? null
  };
}
__name(queryIp, "queryIp");

// src/handlers/tools.ts
var PREFIX = "pending:tool:";
var pendKey = /* @__PURE__ */ __name((uid) => PREFIX + uid, "pendKey");
async function setPending(env2, uid, state, ttl = 600) {
  await env2.KV.put(pendKey(uid), JSON.stringify(state), { expirationTtl: ttl });
}
__name(setPending, "setPending");
async function getPending(env2, uid) {
  try {
    const raw = await env2.KV.get(pendKey(uid));
    if (!raw)
      return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}
__name(getPending, "getPending");
async function clearPending(env2, uid) {
  await env2.KV.delete(pendKey(uid));
}
__name(clearPending, "clearPending");
function toolsKeyboard() {
  return [
    [btn("\u{1F510} Base64 \u7F16\u89E3\u7801", "tl:b64")],
    [btn("\u{1F9FE} JSON \u6574\u7406", "tl:json")],
    [btn("\u{1F310} DNS \u67E5\u8BE2", "tl:dns"), btn("\u{1F4E1} Ping \u68C0\u6D4B", "tl:ping")],
    [btn("\u{1F30D} \u6211\u7684 IP", "tl:ip")],
    [btn("\u2B05 \u8FD4\u56DE\u4E3B\u83DC\u5355", "menu:main")]
  ];
}
__name(toolsKeyboard, "toolsKeyboard");
async function showTools(ctx) {
  const cfg = await getConfig(ctx.env);
  const text = [
    `\u{1F9F0} <b>\u6570\u7801\u5DE5\u5177\u7BB1</b>`,
    ``,
    `\u53EF\u7528\u5DE5\u5177\uFF1A`,
    `\u3000\u{1F510} Base64 \u7F16\u7801 / \u89E3\u7801`,
    `\u3000\u{1F9FE} JSON \u683C\u5F0F\u5316 / \u538B\u7F29`,
    `\u3000\u{1F310} DNS \u67E5\u8BE2\uFF08A / AAAA / MX / TXT\uFF09`,
    `\u3000\u{1F4E1} Ping / HTTP \u5EF6\u8FDF\u68C0\u6D4B`,
    `\u3000\u{1F30D} IP \u5F52\u5C5E\u67E5\u8BE2`,
    ``,
    `\u70B9\u51FB\u4E0B\u65B9\u6309\u94AE\u4F7F\u7528\uFF1B\u6216\u5728\u79C1\u804A\u4E2D\u76F4\u63A5\u8F93\u5165\u547D\u4EE4\uFF0C\u4F8B\u5982\uFF1A`,
    `<code>/b64 encode \u6587\u672C</code>`,
    `<code>/json {"a":1}</code>`,
    `<code>/dns example.com AAAA</code>`,
    `<code>/ping example.com</code>`,
    `<code>/ip</code>`
  ].join("\n");
  await ctx.reply(text, { inlineKeyboard: toolsKeyboard() });
}
__name(showTools, "showTools");
async function handleToolsCallback(ctx, data) {
  const parts = data.split(":").filter(Boolean);
  if (parts.length < 2 || !ctx.from)
    return;
  const op = parts[1];
  switch (op) {
    case "show":
      await showTools(ctx);
      return;
    case "b64": {
      if (parts[2]) {
        const mode = parts[2];
        if (mode !== "encode" && mode !== "decode")
          return;
        await setPending(ctx.env, ctx.from.id, { t: "base64", d: mode });
        await ctx.answer(mode === "encode" ? "\u2705 \u8BF7\u53D1\u9001\u8981\u7F16\u7801\u7684\u6587\u672C" : "\u2705 \u8BF7\u53D1\u9001\u8981\u89E3\u7801\u7684 Base64", true);
      } else {
        await ctx.keypad("\u{1F510} Base64 \u64CD\u4F5C\uFF1A", [
          [btn("\u2B06\uFE0F \u7F16\u7801", "tl:b64:encode"), btn("\u2B07\uFE0F \u89E3\u7801", "tl:b64:decode")],
          [btn("\u2B05 \u8FD4\u56DE\u5DE5\u5177\u7BB1", "tl:show")]
        ]);
      }
      return;
    }
    case "json": {
      if (parts[2]) {
        const d = parts[2];
        await setPending(ctx.env, ctx.from.id, { t: "json", d });
        await ctx.answer("\u2705 \u8BF7\u53D1\u9001 JSON \u5185\u5BB9", true);
      } else {
        await ctx.keypad("\u{1F9FE} JSON \u64CD\u4F5C\uFF1A", [
          [btn("\u{1FA84} \u683C\u5F0F\u5316", "tl:json:beautify"), btn("\u{1F5DC}\uFE0F \u538B\u7F29", "tl:json:minify")],
          [btn("\u2B05 \u8FD4\u56DE\u5DE5\u5177\u7BB1", "tl:show")]
        ]);
      }
      return;
    }
    case "dns":
      await setPending(ctx.env, ctx.from.id, { t: "dns", d: "A" });
      await ctx.answer("\u2705 \u8BF7\u53D1\u9001\u8981\u67E5\u8BE2\u7684\u57DF\u540D\uFF08\u53EF\u9644\u52A0\u8BB0\u5F55\u7C7B\u578B\uFF09", true);
      return;
    case "ping":
      await setPending(ctx.env, ctx.from.id, { t: "ping", d: "" });
      await ctx.answer("\u2705 \u8BF7\u53D1\u9001\u8981\u68C0\u6D4B\u7684\u57DF\u540D / IP", true);
      return;
    case "ip": {
      await ctx.answer("\u67E5\u8BE2\u4E2D\u2026");
      try {
        const info3 = await queryIp();
        await ctx.reply(
          [
            `\u{1F30D} <b>IP \u67E5\u8BE2\u7ED3\u679C</b>`,
            `\u3000IP \u5730\u5740\uFF1A<code>${esc(info3.ip)}</code>`,
            `\u3000\u56FD\u5BB6/\u5730\u533A\uFF1A${info3.loc ?? "\u672A\u77E5"}`,
            `\u3000\u6570\u636E\u4E2D\u5FC3\uFF1A${info3.colo ?? "-"}`,
            `\u3000ASN\uFF1A${info3.asn ?? "-"}`
          ].join("\n"),
          { inlineKeyboard: [[btn("\u{1F504} \u5237\u65B0", "tl:ip"), btn("\u2B05 \u8FD4\u56DE\u5DE5\u5177\u7BB1", "tl:show")]] }
        );
      } catch (e) {
        await ctx.reply(`\u67E5\u8BE2\u5931\u8D25\uFF1A${escMessage(e)}`, { inlineKeyboard: [[btn("\u2B05 \u8FD4\u56DE\u5DE5\u5177\u7BB1", "tl:show")]] });
      }
      return;
    }
    default:
      return;
  }
}
__name(handleToolsCallback, "handleToolsCallback");
async function handleToolInput(ctx, input) {
  const state = await getPending(ctx.env, ctx.from.id);
  if (!state)
    return;
  await clearPending(ctx.env, ctx.from.id);
  const body = input.slice(0, 8e3);
  try {
    switch (state.t) {
      case "base64": {
        const out = state.d === "encode" ? b64Encode(body) : b64Decode(body);
        await ctx.reply(
          `<b>${state.d === "encode" ? "\u7F16\u7801" : "\u89E3\u7801"}\u7ED3\u679C\uFF1A</b>
<code>${esc(out.slice(0, 3800))}</code>`,
          { inlineKeyboard: [[btn("\u2B05 \u8FD4\u56DE\u5DE5\u5177\u7BB1", "tl:show")]] }
        );
        break;
      }
      case "json": {
        const out = state.d === "beautify" ? jsonBeautify(body) : jsonMinify(body);
        for (const part of splitLong(out, 3800)) {
          await ctx.reply(`<code>${esc(part)}</code>`);
        }
        await ctx.reply("\u5904\u7406\u5B8C\u6210 \u2705", { inlineKeyboard: [[btn("\u2B05 \u8FD4\u56DE\u5DE5\u5177\u7BB1", "tl:show")]] });
        break;
      }
      case "dns": {
        const parts = body.trim().split(/\s+/);
        const domain2 = parts[0];
        const type = ((parts[1] ?? state.d) || "A").toUpperCase();
        if (!domain2)
          throw new Error("\u8BF7\u8F93\u5165\u57DF\u540D");
        const answers = await dnsQuery(domain2, type);
        const lines = answers.map((a) => `\u3000\u25CF <code>${esc(a.data)}</code>\u3000<code>${a.type}</code> TTL ${a.TTL}`);
        await ctx.reply(
          [`\u{1F310} DNS \u67E5\u8BE2\uFF1A<b>${esc(domain2)}</b> <code>${type}</code>`, ...lines].join("\n"),
          { inlineKeyboard: [[btn("\u2B05 \u8FD4\u56DE\u5DE5\u5177\u7BB1", "tl:show")]] }
        );
        break;
      }
      case "ping": {
        const result = await pingHost(body);
        await ctx.reply(
          [
            `\u{1F4E1} Ping \u68C0\u6D4B\uFF1A<b>${esc(result.host)}</b>`,
            `\u3000HTTP \u72B6\u6001\uFF1A${result.httpStatus !== null ? `<code>${result.httpStatus}</code>` : "\u274C \u4E0D\u53EF\u8FBE"}`,
            `\u3000\u5EF6\u8FDF\uFF1A<b>${result.latencyMs}ms</b>`
          ].join("\n"),
          { inlineKeyboard: [[btn("\u2B05 \u8FD4\u56DE\u5DE5\u5177\u7BB1", "tl:show")]] }
        );
        break;
      }
    }
  } catch (e) {
    await ctx.reply(`\u26A0\uFE0F \u5904\u7406\u5931\u8D25\uFF1A${escMessage(e)}`, {
      inlineKeyboard: [[btn("\u2B05 \u8FD4\u56DE\u5DE5\u5177\u7BB1", "tl:show")]]
    });
  }
}
__name(handleToolInput, "handleToolInput");
function escMessage(e) {
  return esc(e instanceof Error ? e.message : String(e));
}
__name(escMessage, "escMessage");

// src/handlers/tutorials.ts
async function tutorialsHome(ctx) {
  const cats = await listTutorialCategories(ctx.env.DB);
  const lines = cats.map((c) => [btn(`\u{1F4C2} ${c}`, `tu:cat:${c}`)]);
  if (cats.length === 0) {
    await ctx.reply("\u{1F4DA} \u6559\u7A0B\u4E2D\u5FC3\n\n\u6682\u65E0\u6559\u7A0B\uFF0C\u677F\u5757\u5EFA\u8BBE\u4E2D\u2026", {
      inlineKeyboard: [[btn("\u2B05 \u8FD4\u56DE\u4E3B\u83DC\u5355", "menu:main")]]
    });
    return;
  }
  await ctx.reply("\u{1F4DA} <b>\u6559\u7A0B\u4E2D\u5FC3</b>\n\u9009\u62E9\u5206\u7C7B\u6D4F\u89C8\uFF1A", {
    inlineKeyboard: [...lines, [btn("\u2B05 \u8FD4\u56DE\u4E3B\u83DC\u5355", "menu:main")]]
  });
}
__name(tutorialsHome, "tutorialsHome");
async function tutorialsByCategory(ctx, category) {
  const list = await listTutorials(ctx.env.DB, category);
  if (list.length === 0) {
    await ctx.reply("\u8BE5\u5206\u7C7B\u6682\u65E0\u6559\u7A0B\u3002", { inlineKeyboard: [[btn("\u2B05 \u8FD4\u56DE\u5206\u7C7B", "tu:show")]] });
    return;
  }
  const lines = list.map((t) => [btn(`\u{1F4C4} ${t.title}\uFF08${t.view_count}\uFF09`, `tu:it:${t.id}`)]);
  await ctx.reply(`\u{1F4C2} <b>${esc(category)}</b>\uFF08${list.length} \u7BC7\uFF09`, {
    inlineKeyboard: [...lines, [btn("\u2B05 \u8FD4\u56DE\u5206\u7C7B", "tu:show")]]
  });
}
__name(tutorialsByCategory, "tutorialsByCategory");
async function tutorialContent(ctx, id) {
  const tut = await getTutorial(ctx.env.DB, id);
  if (!tut) {
    await ctx.reply("\u6559\u7A0B\u4E0D\u5B58\u5728\u3002", { inlineKeyboard: [[btn("\u2B05 \u8FD4\u56DE\u5206\u7C7B", "tu:show")]] });
    return;
  }
  const body = trunc(tut.content, 3800);
  const text = [
    `\u{1F4C4} <b>${esc(tut.title)}</b>`,
    `\u{1F4C2} ${esc(tut.category)}\u3000\u{1F440} ${tut.view_count} \u6B21\u6D4F\u89C8`,
    tut.summary ? `
\u{1F4A1} ${esc(tut.summary)}
` : "",
    ``,
    body
  ].join("\n");
  await ctx.reply(text, { inlineKeyboard: [[btn("\u2B05 \u8FD4\u56DE\u5206\u7C7B", "tu:show")]] });
}
__name(tutorialContent, "tutorialContent");
async function adminAddTutorial(ctx, arg) {
  const input = arg.trim();
  if (!input) {
    await ctx.reply("\u7528\u6CD5\uFF1A/tutorial add \u6807\u9898|\u5206\u7C7B|\u6458\u8981|\u6B63\u6587");
    return;
  }
  const parts = input.split("|").map((s) => s.trim());
  const title2 = parts[0];
  const category = parts[1] || "\u5176\u4ED6";
  const summary = parts[2] || "";
  const content = parts.slice(3).join("|");
  if (!title2 || !content) {
    await ctx.reply("\u81F3\u5C11\u9700\u8981\uFF1A\u6807\u9898|\u6B63\u6587");
    return;
  }
  await addTutorial(ctx.env.DB, { title: title2, category, summary, content, authorId: ctx.from.id });
  await ctx.reply(`\u2705 \u6559\u7A0B\u300C${esc(title2)}\u300D\u5DF2\u53D1\u5E03\u5230\u5206\u7C7B\u300C${esc(category)}\u300D\u3002`);
}
__name(adminAddTutorial, "adminAddTutorial");

// src/handlers/aiChat.ts
async function cmdAI(ctx) {
  if (!ctx.from)
    return;
  const cfg = await getConfig(ctx.env);
  if (!cfg.ai.enabled) {
    await ctx.reply("AI \u52A9\u624B\u6682\u65F6\u5173\u95ED\u3002");
    return;
  }
  let prompt = ctx.arg.trim();
  if (!prompt && ctx.message?.reply_to_message?.text) {
    prompt = ctx.message.reply_to_message.text.trim();
  }
  if (!prompt) {
    await ctx.reply("\u{1F600} \u7528\u6CD5\uFF1A/ai \u4F60\u7684\u95EE\u9898\n\u4F8B\u5982\uFF1A/ai \u5E2E\u6211\u89E3\u91CA\u4E00\u4E0B\u4EC0\u4E48\u662F DNS", {
      inlineKeyboard: [[btn("\u2B05 \u8FD4\u56DE\u4E3B\u83DC\u5355", "menu:main")]]
    });
    return;
  }
  prompt = trunc(prompt, 2e3);
  const allowed = await rateLimit(ctx.env, "ai", `u:${ctx.from.id}`, cfg.ai.rateLimitPerMin, 60);
  if (!allowed) {
    await ctx.reply("\u23F3 \u8BF7\u6C42\u592A\u9891\u7E41\u5566\uFF0C\u8BF7\u7A0D\u540E\u518D\u8BD5\uFF08\u6BCF\u5206\u949F " + cfg.ai.rateLimitPerMin + " \u6B21\uFF09\u3002");
    return;
  }
  try {
    await ctx.bot.sendChatAction(ctx.chat.id, "typing");
    const res = await ctx.env.AI.run(cfg.ai.model, {
      prompt: `${cfg.ai.promptSystem}

\u7528\u6237\u95EE\u9898\uFF1A${prompt}

\u56DE\u7B54\uFF1A`,
      max_tokens: cfg.ai.maxTokens,
      temperature: 0.7
    });
    const answer = (res?.response ?? res?.output ?? "").toString().trim();
    if (!answer)
      throw new Error("\u6A21\u578B\u672A\u8FD4\u56DE\u5185\u5BB9");
    await ctx.reply(splitAnswer(answer), {
      inlineKeyboard: [[btn("\u{1F9E0} \u518D\u95EE\u4E00\u4E2A", "ai:show"), btn("\u2B05 \u8FD4\u56DE\u4E3B\u83DC\u5355", "menu:main")]]
    });
  } catch (e) {
    await ctx.reply(
      `\u{1F916} AI \u8C03\u7528\u5931\u8D25\uFF1A${e instanceof Error ? e.message : "\u672A\u77E5\u9519\u8BEF"}
\u8BF7\u786E\u8BA4\u5DF2\u5F00\u901A Workers AI \u989D\u5EA6\u5E76\u6B63\u786E\u7ED1\u5B9A\u6A21\u578B\u3002`
    );
  }
}
__name(cmdAI, "cmdAI");
async function aiHelp(ctx) {
  const cfg = await getConfig(ctx.env);
  await ctx.reply(
    [
      `\u{1F916} <b>AI \u52A9\u624B</b>`,
      ``,
      `\u76F4\u63A5\u53D1\u9001 <code>/ai \u95EE\u9898</code>\uFF0C\u6216\u56DE\u590D\u67D0\u6761\u6D88\u606F\u8BF4 <code>/ai</code>\uFF0C\u5373\u53EF\u8BA9 AI \u56DE\u7B54\u3002`,
      ``,
      `\u5F53\u524D\u6A21\u578B\uFF1A<code>${cfg.ai.model}</code>`,
      `\u9891\u7387\u9650\u5236\uFF1A${cfg.ai.rateLimitPerMin}/\u5206\u949F`
    ].join("\n"),
    { inlineKeyboard: [[btn("\u2B05 \u8FD4\u56DE\u4E3B\u83DC\u5355", "menu:main")]] }
  );
}
__name(aiHelp, "aiHelp");
function splitAnswer(t) {
  if (t.length <= 4e3)
    return t;
  return t.slice(0, 3950) + "\u2026";
}
__name(splitAnswer, "splitAnswer");

// src/handlers/menu.ts
function mainMenuText(user, cfg, rank) {
  const uname = user ? esc(user.first_name ?? "") : "";
  const pname = cfg.brand.pointsName;
  return [
    `${cfg.brand.greeting}`,
    ``,
    `\u{1F464} ${uname || "\u65B0\u670B\u53CB"}${user?.username ? ` (@${esc(user.username)})` : ""}`,
    `\u{1F4B0} \u5F53\u524D${pname}\uFF1A<b>${fmt(user?.points ?? 0)}</b>\u3000\u3000\u{1F3C5} \u6392\u884C\uFF1A<b>#${fmt(rank)}</b>`,
    `\u{1F4CC} \u7D2F\u8BA1\u7B7E\u5230\uFF1A<b>${fmt(user?.total_checkins ?? 0)}</b> \u5929`,
    ``,
    `\u4ECE\u4E0B\u65B9\u83DC\u5355\u9009\u62E9\u529F\u80FD\u5427 \u{1F447}`
  ].join("\n");
}
__name(mainMenuText, "mainMenuText");
function mainKeyboard(isAdmin, _registered = true) {
  const lines = [
    [{ text: "\u{1F4DD} \u6BCF\u65E5\u7B7E\u5230", callback_data: "ck:do" }, { text: "\u{1F464} \u6211\u7684\u89E3\u7801\u70B9", callback_data: "pt:me" }],
    [{ text: "\u{1F9F0} \u5DE5\u5177\u7BB1", callback_data: "tl:show" }, { text: "\u{1F4DA} \u6559\u7A0B\u4E2D\u5FC3", callback_data: "tu:show" }],
    [{ text: "\u{1F916} AI \u52A9\u624B", callback_data: "ai:show" }, { text: "\u{1F525} \u6392\u884C\u699C", callback_data: "pt:top" }],
    [{ text: "\u{1F381} \u9080\u8BF7\u5956\u52B1", callback_data: "in:me" }, { text: "\u2753 \u5E2E\u52A9", callback_data: "hp:show" }]
  ];
  if (isAdmin)
    lines.push([{ text: "\u2699\uFE0F \u7BA1\u7406\u9762\u677F", callback_data: "ad:panel" }]);
  return lines;
}
__name(mainKeyboard, "mainKeyboard");

// src/handlers/faq.ts
function matchFaq(cfg, text) {
  const t = (text ?? "").trim();
  if (!t)
    return null;
  const lower = t.toLowerCase();
  for (const rule of cfg.faq) {
    for (const kw of rule.keywords) {
      const kl = kw.toLowerCase();
      const hit = rule.mode === "exact" ? lower === kl : rule.mode === "startsWith" ? lower.startsWith(kl) : !kl || lower.includes(kl);
      if (hit)
        return rule.reply;
    }
  }
  return null;
}
__name(matchFaq, "matchFaq");
function faqListText(cfg) {
  const lines = ["\u{1F4CC} \u5E38\u89C1\u95EE\u9898\uFF08\u81EA\u52A8\u56DE\u590D\uFF09", ""];
  for (const rule of cfg.faq) {
    const kws = rule.keywords.slice(0, 3).map((k) => `\u300C${k}\u300D`).join("\u3001");
    lines.push(`\u{1F9E9} ${kws}`);
    lines.push(`\u3000\u21B3 ${rule.reply.replace(/\n/g, "\n\u3000\u21B3 ")}`);
    lines.push("");
  }
  lines.push("\u76F4\u63A5\u5728\u79C1\u804A\u4E2D\u53D1\u9001\u8FD9\u4E9B\u5173\u952E\u8BCD\u5373\u53EF\u89E6\u53D1\uFF0C\u4E5F\u53EF\u4EE5\u8F93\u5165 /help \u67E5\u770B\u66F4\u591A\u3002");
  return lines.join("\n");
}
__name(faqListText, "faqListText");

// src/handlers/commands.ts
var cmdStart = /* @__PURE__ */ __name(async (ctx) => {
  if (!ctx.from)
    return;
  const cfg = await getConfig(ctx.env);
  const payload = ctx.arg.trim();
  let joinNote = "";
  if (payload.startsWith("ref_")) {
    const inviterId = Number(payload.slice(4));
    if (Number.isInteger(inviterId) && inviterId > 0 && inviterId !== ctx.from.id) {
      const r = await registerInvite(
        ctx.env.DB,
        inviterId,
        ctx.from.id,
        cfg.invite.invitedReward,
        cfg.invite.inviterReward
      );
      if (r === "ok") {
        joinNote = `\u{1F389} \u4F60\u901A\u8FC7\u9080\u8BF7\u94FE\u63A5\u52A0\u5165\uFF0C\u83B7\u5F97 <b>+${cfg.invite.invitedReward}</b> ${cfg.brand.pointsName}\uFF01

`;
      }
    }
  }
  const [user, rank] = await Promise.all([
    getUser(ctx.env.DB, ctx.from.id),
    getUserRank(ctx.env.DB, ctx.from.id)
  ]);
  await ctx.reply(joinNote + mainMenuText(user, cfg, rank), {
    inlineKeyboard: mainKeyboard(ctx.isAdmin, !!user)
  });
}, "cmdStart");
var cmdHelp = /* @__PURE__ */ __name(async (ctx) => {
  const text = [
    `\u{1F916} <b>\u6570\u7801\u89E3\u7801\u5DE5\u5177\u7AD9</b>`,
    ``,
    `\u{1F4CC} \u57FA\u7840\u529F\u80FD`,
    `<code>/start</code> \u6CE8\u518C & \u4E3B\u83DC\u5355`,
    `<code>/me</code> \u6211\u7684\u89E3\u7801\u70B9  <code>/top</code> \u6392\u884C\u699C`,
    `<code>/checkin</code> \u6BCF\u65E5\u7B7E\u5230`,
    `<code>/invite</code> \u9080\u8BF7\u597D\u53CB\u8D5A\u89E3\u7801\u70B9`,
    `<code>/redeem</code> \u4F7F\u7528\u5151\u6362\u7801`,
    ``,
    `\u{1F9F0} \u5DE5\u5177\u7BB1`,
    `<code>/tools</code> \u5DE5\u5177\u7BB1\u9762\u677F`,
    `<code>/b64</code> Base64  <code>/json</code> JSON\u6574\u7406`,
    `<code>/dns</code> DNS\u67E5\u8BE2  <code>/ping</code> \u5EF6\u8FDF\u68C0\u6D4B  <code>/ip</code> IP\u67E5\u8BE2`,
    ``,
    `\u{1F4DA} \u5B66\u4E60 & AI`,
    `<code>/tutorials</code> \u6559\u7A0B\u4E2D\u5FC3`,
    `<code>/faq</code> \u5E38\u89C1\u95EE\u9898`,
    `<code>/ai \u95EE\u9898</code> AI \u667A\u80FD\u95EE\u7B54`,
    ``,
    `\u79C1\u804A\u4E2D\u8F93\u5165\u4EFB\u610F\u6587\u5B57\u4E5F\u4F1A\u89E6\u53D1\u81EA\u52A8\u95EE\u7B54\u4E0E AI \u56DE\u590D\u54E6\u3002`
  ].join("\n");
  await ctx.reply(text, { inlineKeyboard: [[btn("\u2B05 \u8FD4\u56DE\u4E3B\u83DC\u5355", "menu:main")]] });
}, "cmdHelp");
var cmdFaq = /* @__PURE__ */ __name(async (ctx) => {
  const cfg = await getConfig(ctx.env);
  await ctx.reply(faqListText(cfg), { inlineKeyboard: [[btn("\u2B05 \u8FD4\u56DE\u4E3B\u83DC\u5355", "menu:main")]] });
}, "cmdFaq");
var cmdCancel = /* @__PURE__ */ __name(async (ctx) => {
  if (ctx.from)
    await clearPending(ctx.env, ctx.from.id);
  await ctx.reply("\u5DF2\u53D6\u6D88\u5F53\u524D\u64CD\u4F5C\u3002", { inlineKeyboard: [[btn("\u2B05 \u8FD4\u56DE\u4E3B\u83DC\u5355", "menu:main")]] });
}, "cmdCancel");
var cmdB64 = /* @__PURE__ */ __name(async (ctx) => {
  const raw = ctx.arg.trim();
  if (!raw)
    return showTools(ctx);
  const m = raw.match(/^(enc(ode)?|dec(ode)?)\s+([\s\S]+)$/i);
  const mode = m ? /^de/i.test(m[1]) ? "decode" : "encode" : "encode";
  const data = m ? m[3] : raw;
  try {
    const out = mode === "encode" ? b64Encode(data) : b64Decode(data);
    await ctx.reply(`<b>${mode === "encode" ? "\u7F16\u7801" : "\u89E3\u7801"}\u7ED3\u679C\uFF1A</b>
<code>${esc(out.slice(0, 3800))}</code>`);
  } catch (e) {
    await ctx.reply(`\u26A0\uFE0F ${e instanceof Error ? e.message : "\u5904\u7406\u5931\u8D25"}`);
  }
}, "cmdB64");
var cmdJson = /* @__PURE__ */ __name(async (ctx) => {
  const raw = ctx.arg.trim();
  if (!raw)
    return showTools(ctx);
  try {
    const out = jsonBeautify(raw);
    await ctx.reply(`\u{1F9FE} \u683C\u5F0F\u5316\u7ED3\u679C\uFF1A
<code>${esc(out.slice(0, 3800))}</code>`);
  } catch {
    await ctx.reply(`\u26A0\uFE0F \u65E0\u6CD5\u89E3\u6790 JSON\uFF0C\u8BF7\u68C0\u67E5\u683C\u5F0F\u662F\u5426\u6B63\u786E\u3002`);
  }
}, "cmdJson");
var cmdDns = /* @__PURE__ */ __name(async (ctx) => {
  const parts = ctx.arg.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    await ctx.reply("\u7528\u6CD5\uFF1A/dns <\u57DF\u540D> [\u8BB0\u5F55\u7C7B\u578B(A/AAAA/MX/TXT)]");
    return;
  }
  const [domain2, type = "A"] = parts;
  try {
    const answers = await dnsQuery(domain2, type.toUpperCase());
    const lines = answers.map((a) => `\u3000\u25CF <code>${esc(a.data)}</code> <code>${a.type}</code> TTL ${a.TTL}`);
    await ctx.reply([`\u{1F310} DNS \u67E5\u8BE2\uFF1A<b>${esc(domain2)}</b> <code>${type.toUpperCase()}</code>`, ...lines].join("\n"));
  } catch (e) {
    await ctx.reply(`\u26A0\uFE0F ${e instanceof Error ? e.message : "\u67E5\u8BE2\u5931\u8D25"}`);
  }
}, "cmdDns");
var cmdPing = /* @__PURE__ */ __name(async (ctx) => {
  const host = ctx.arg.trim();
  if (!host) {
    await ctx.reply("\u7528\u6CD5\uFF1A/ping <\u57DF\u540D\u6216IP>", { inlineKeyboard: [[btn("\u2B05 \u8FD4\u56DE\u4E3B\u83DC\u5355", "menu:main")]] });
    return;
  }
  try {
    const r = await pingHost(host);
    await ctx.reply(
      [
        `\u{1F4E1} Ping \u68C0\u6D4B\uFF1A<b>${esc(r.host)}</b>`,
        `\u3000HTTP \u72B6\u6001\uFF1A${r.httpStatus !== null ? `<code>${r.httpStatus}</code>` : "\u274C \u4E0D\u53EF\u8FBE"}`,
        `\u3000\u5EF6\u8FDF\uFF1A<b>${r.latencyMs}ms</b>`
      ].join("\n")
    );
  } catch (e) {
    await ctx.reply(`\u26A0\uFE0F ${e instanceof Error ? e.message : "\u68C0\u6D4B\u5931\u8D25"}`);
  }
}, "cmdPing");
var cmdIp = /* @__PURE__ */ __name(async (ctx) => {
  try {
    const info3 = await queryIp();
    await ctx.reply(
      [
        `\u{1F30D} <b>IP \u67E5\u8BE2\u7ED3\u679C</b>`,
        `\u3000IP \u5730\u5740\uFF1A<code>${esc(info3.ip)}</code>`,
        `\u3000\u56FD\u5BB6/\u5730\u533A\uFF1A${info3.loc ?? "\u672A\u77E5"}`,
        `\u3000\u6570\u636E\u4E2D\u5FC3\uFF1A${info3.colo ?? "-"}`,
        `\u3000ASN\uFF1A${info3.asn ?? "-"}`
      ].join("\n"),
      { inlineKeyboard: [[btn("\u{1F504} \u5237\u65B0", "tl:ip")]] }
    );
  } catch {
    await ctx.reply("\u26A0\uFE0F IP \u67E5\u8BE2\u5931\u8D25\uFF0C\u8BF7\u7A0D\u540E\u518D\u8BD5\u3002");
  }
}, "cmdIp");
var cmdTutorials = /* @__PURE__ */ __name(async (ctx) => {
  const arg = ctx.arg.trim();
  if (arg.startsWith("add ")) {
    if (!ctx.isAdmin && !ctx.isOwner) {
      await ctx.reply("\u274C \u65E0\u7BA1\u7406\u5458\u6743\u9650");
      return;
    }
    await adminAddTutorial(ctx, arg.slice(4));
    return;
  }
  await tutorialsHome(ctx);
}, "cmdTutorials");
var COMMANDS = {
  start: cmdStart,
  me: cmdMe,
  help: cmdHelp,
  faq: cmdFaq,
  checkin: doCheckin,
  top: cmdTop,
  invite: cmdInvite,
  redeem: cmdRedeem,
  tools: showTools,
  b64: cmdB64,
  json: cmdJson,
  dns: cmdDns,
  ping: cmdPing,
  ip: cmdIp,
  ai: cmdAI,
  tutorial: cmdTutorials,
  tutorials: cmdTutorials,
  cancel: cmdCancel
  // 管理员命令在 adminCommands.ts 中合并
};

// src/utils/tokens.ts
var CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
function randomCode(len = 8) {
  const bytes = new Uint8Array(len);
  crypto.getRandomValues(bytes);
  let out = "";
  for (let i = 0; i < len; i++)
    out += CODE_CHARS[bytes[i] % CODE_CHARS.length];
  return out;
}
__name(randomCode, "randomCode");
function genOrderCodes(count3, len = 8) {
  const codes = [];
  const seen = /* @__PURE__ */ new Set();
  let guard = 0;
  while (codes.length < count3 && guard < 1e3) {
    guard++;
    const c = randomCode(len);
    if (!seen.has(c)) {
      seen.add(c);
      codes.push(c);
    }
  }
  return codes;
}
__name(genOrderCodes, "genOrderCodes");

// src/handlers/admin.ts
async function adminPanel(ctx) {
  await ctx.reply(
    `\u2699\uFE0F <b>\u7BA1\u7406\u9762\u677F</b>

\u5E38\u7528\u7BA1\u7406\u547D\u4EE4\uFF1A
<code>/stats</code>\u3000\u7EDF\u8BA1\u6982\u89C8
<code>/ban id [\u539F\u56E0]</code>\u3000\u62C9\u9ED1\u7528\u6237
<code>/unban id</code>\u3000\u89E3\u9664\u9ED1\u540D\u5355
<code>/give id \u89E3\u7801\u70B9</code>\u3000\u8C03\u6574\u89E3\u7801\u70B9
<code>/gencode \u89E3\u7801\u70B9 \u6570\u91CF</code>\u3000\u751F\u6210\u5151\u6362\u7801
<code>/broadcast \u6587\u6848</code>\u3000\u7FA4\u53D1\u5E7F\u64AD
<code>/notify id \u6587\u6848</code>\u3000\u79C1\u804A\u63A8\u9001
<code>/cfg</code>\u3000\u3000\u67E5\u770B\u914D\u7F6E
<code>/setjson {...}</code>\u3000\u66F4\u65B0\u914D\u7F6E
<code>/reload</code>\u3000\u91CD\u8F7D\u914D\u7F6E
<code>/log</code>\u3000\u64CD\u4F5C\u65E5\u5FD7`,
    {
      inlineKeyboard: [
        [btn("\u{1F4CA} \u7EDF\u8BA1", "ad:stats"), btn("\u{1F527} \u91CD\u8F7D\u914D\u7F6E", "ad:reload")],
        [btn("\u2B05 \u8FD4\u56DE\u4E3B\u83DC\u5355", "menu:main")]
      ]
    }
  );
}
__name(adminPanel, "adminPanel");
async function cmdStats(ctx) {
  const s = await getStats(ctx.env.DB);
  await ctx.reply(
    [
      `\u{1F4CA} <b>\u8FD0\u884C\u7EDF\u8BA1</b>`,
      ``,
      `\u{1F465} \u6CE8\u518C\u7528\u6237\uFF1A<b>${fmt(s.users)}</b>`,
      `\u{1F48E} \u53D1\u884C\u89E3\u7801\u70B9\uFF1A<b>${fmt(s.points)}</b>`,
      `\u2705 \u4ECA\u65E5\u7B7E\u5230\uFF1A<b>${fmt(s.todayCheckins)}</b>`,
      `\u{1F39F}\uFE0F \u672A\u7528\u5151\u6362\u7801\uFF1A<b>${fmt(s.unusedOrders)}</b>\uFF08${fmt(s.unusedPoints)} \u89E3\u7801\u70B9\uFF09`
    ].join("\n")
  );
}
__name(cmdStats, "cmdStats");
async function cmdBan(ctx) {
  const arg = ctx.arg;
  const parts = arg.trim().split(/\s+/);
  const id = Number(parts[0]);
  if (!Number.isInteger(id) || id <= 0) {
    await ctx.reply("\u7528\u6CD5\uFF1A/ban <\u7528\u6237ID> [\u539F\u56E0]");
    return;
  }
  const reason = parts.slice(1).join(" ") || "\u65E0";
  await ban(ctx.env.DB, "user", id, reason, ctx.from.id);
  await ctx.reply(`\u{1F6AB} \u5DF2\u5C06\u7528\u6237 <b>${id}</b> \u52A0\u5165\u9ED1\u540D\u5355\u3002\u539F\u56E0\uFF1A${esc(reason)}`);
  await appendLog(ctx.env, `\u{1F6AB} \u62C9\u9ED1 ${id}\uFF08${reason}\uFF09by ${ctx.from.id}`);
}
__name(cmdBan, "cmdBan");
async function cmdUnban(ctx) {
  const arg = ctx.arg;
  const id = Number(arg.trim());
  if (!Number.isInteger(id) || id <= 0) {
    await ctx.reply("\u7528\u6CD5\uFF1A/unban <\u7528\u6237ID>");
    return;
  }
  await unban(ctx.env.DB, "user", id);
  await ctx.reply(`\u2705 \u5DF2\u89E3\u9664\u7528\u6237 <b>${id}</b> \u7684\u9ED1\u540D\u5355\u3002`);
  await appendLog(ctx.env, `\u2705 \u89E3\u5C01 ${id} by ${ctx.from.id}`);
}
__name(cmdUnban, "cmdUnban");
async function cmdGive(ctx) {
  const arg = ctx.arg;
  const parts = arg.trim().split(/\s+/);
  const id = Number(parts[0]);
  const points = Number(parts[1]);
  if (!Number.isInteger(id) || id <= 0 || !Number.isInteger(points)) {
    await ctx.reply("\u7528\u6CD5\uFF1A/give <\u7528\u6237ID> <\u89E3\u7801\u70B9>\uFF08\u53EF\u4E3A\u8D1F\u6570\uFF09");
    return;
  }
  const user = await addPoints(ctx.env.DB, id, points);
  await ctx.reply(
    `\u2705 \u5DF2\u8C03\u6574\u7528\u6237 <b>${id}</b> \u89E3\u7801\u70B9\uFF1A<code>${points > 0 ? "+" : ""}${points}</code>\uFF0C\u5F53\u524D <b>${fmt(user.points)}</b>`
  );
  await appendLog(ctx.env, `\u{1F4B0} \u8C03\u6574\u79EF\u5206 ${id} ${points} by ${ctx.from.id}`);
}
__name(cmdGive, "cmdGive");
async function cmdGenCode(ctx) {
  const arg = ctx.arg;
  const parts = arg.trim().split(/\s+/);
  const amount = Number(parts[0]);
  const count3 = Math.min(Math.max(Number(parts[1] ?? "1"), 1), 50);
  if (!Number.isInteger(amount) || amount <= 0) {
    await ctx.reply("\u7528\u6CD5\uFF1A/gencode <\u89E3\u7801\u70B9\u6570\u91CF> <\u751F\u6210\u4E2A\u6570>");
    return;
  }
  const codes = genOrderCodes(count3);
  for (const c of codes)
    await createOrder(ctx.env.DB, c, amount, ctx.from.id);
  if (ctx.from)
    await appendLog(ctx.env, `\u{1F39F}\uFE0F \u751F\u6210 ${count3} \u4E2A\u5151\u6362\u7801\uFF0C\u6BCF\u4E2A ${amount} by ${ctx.from.id}`);
  await ctx.reply(`\u2705 \u5DF2\u751F\u6210 <b>${count3}</b> \u4E2A\u5151\u6362\u7801\uFF0C\u6BCF\u4E2A ${amount} \u89E3\u7801\u70B9\uFF1A
<code>${codes.join("</code>\n<code>")}</code>`);
}
__name(cmdGenCode, "cmdGenCode");
async function cmdCfg(ctx) {
  const cfg = await getConfig(ctx.env);
  const json = JSON.stringify(cfg, null, 2).slice(0, 3800);
  await ctx.reply(`\u{1F4DC} \u5F53\u524D\u914D\u7F6E\uFF08JSON\uFF09\uFF1A
<code>${esc(json)}</code>`);
}
__name(cmdCfg, "cmdCfg");
async function cmdSetJson(ctx) {
  try {
    const obj = JSON.parse(ctx.arg);
    if (typeof obj !== "object" || Array.isArray(obj) || obj === null)
      throw new Error("\u5FC5\u987B\u662F JSON \u5BF9\u8C61");
    await setConfigOverlay(ctx.env, obj);
    await ctx.reply("\u2705 \u914D\u7F6E\u5DF2\u66F4\u65B0\uFF08\u8986\u76D6\u5C42\u4E0E\u9ED8\u8BA4\u914D\u7F6E\u5408\u5E76\uFF09\u3002\u53EF\u7528 /cfg \u67E5\u770B\u3002");
    if (ctx.from)
      await appendLog(ctx.env, `\u2699\uFE0F \u66F4\u65B0\u914D\u7F6E by ${ctx.from.id}`);
  } catch (e) {
    await ctx.reply(`\u274C \u914D\u7F6E JSON \u89E3\u6790\u5931\u8D25\uFF1A${e instanceof Error ? e.message : "\u672A\u77E5\u9519\u8BEF"}`);
  }
}
__name(cmdSetJson, "cmdSetJson");
async function cmdReload(ctx) {
  await resetConfig(ctx.env);
  await getConfig(ctx.env);
  await ctx.reply("\u2705 \u914D\u7F6E\u5DF2\u91CD\u7F6E\u4E3A\u9ED8\u8BA4\u503C\u3002");
  if (ctx.from)
    await appendLog(ctx.env, `\u{1F527} \u91CD\u7F6E\u914D\u7F6E by ${ctx.from.id}`);
}
__name(cmdReload, "cmdReload");
async function cmdLog(ctx) {
  const lines = (await readLogs(ctx.env)).slice(-30);
  if (lines.length === 0) {
    await ctx.reply("\u6682\u65E0\u65E5\u5FD7\u3002");
    return;
  }
  await ctx.reply(`\u{1F4DC} <b>\u6700\u8FD1\u64CD\u4F5C</b>
<code>${esc(lines.join("\n"))}</code>`);
}
__name(cmdLog, "cmdLog");
async function cmdBroadcast(ctx) {
  const arg = ctx.arg;
  if (!arg.trim()) {
    await ctx.reply("\u7528\u6CD5\uFF1A/broadcast <\u6587\u6848>");
    return;
  }
  const ids = (await collectUserIds(ctx.env)).map((r) => r.id);
  if (ids.length === 0) {
    await ctx.reply("\u6CA1\u6709\u53EF\u7FA4\u53D1\u7684\u7528\u6237\u3002");
    return;
  }
  const jobId = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  await ctx.env.TASK_QUEUE.send({
    type: "broadcast",
    id: jobId,
    msgId: jobId,
    ids,
    text: arg.trim(),
    parseMode: void 0
  });
  if (ctx.from)
    await appendLog(ctx.env, `\u{1F4E3} \u53D1\u8D77\u7FA4\u53D1\u7ED9 ${ids.length} \u4EBA\uFF08${jobId}\uFF09by ${ctx.from.id}`);
  await ctx.reply(`\u{1F4E3} \u5DF2\u52A0\u5165\u961F\u5217\uFF1A\u5C06\u5411 <b>${ids.length}</b> \u4F4D\u7528\u6237\u7FA4\u53D1\u3002\u4EFB\u52A1 ID\uFF1A<code>${jobId}</code>`);
}
__name(cmdBroadcast, "cmdBroadcast");
async function cmdNotify(ctx) {
  const [idStr, ...rest] = ctx.arg.trim().split(/\s+/);
  const id = Number(idStr);
  const text = rest.join(" ");
  if (!Number.isInteger(id) || id <= 0 || !text) {
    await ctx.reply("\u7528\u6CD5\uFF1A/notify <\u7528\u6237ID> <\u6587\u6848>");
    return;
  }
  await ctx.env.TASK_QUEUE.send({ type: "notify", chatId: id, text, parseMode: void 0 });
  await ctx.reply(`\u2705 \u5DF2\u52A0\u5165\u961F\u5217\u63A8\u9001\u6D88\u606F\u7ED9 <b>${id}</b>\u3002`);
}
__name(cmdNotify, "cmdNotify");
async function collectUserIds(env2) {
  const res = await env2.DB.prepare("SELECT id FROM users WHERE is_banned = 0 AND status = 'active'").all();
  return res.results ?? [];
}
__name(collectUserIds, "collectUserIds");
var LOG_KV_KEY = "bot:log:v1";
async function readLogs(env2) {
  try {
    const raw = await env2.KV.get(LOG_KV_KEY);
    if (!raw)
      return [];
    return raw.split("\n");
  } catch {
    return [];
  }
}
__name(readLogs, "readLogs");
async function appendLog(env2, line) {
  try {
    const now = (/* @__PURE__ */ new Date()).toISOString().replace("T", " ").slice(0, 19);
    const prev = (await readLogs(env2)).slice(-200);
    prev.push(`[${now}] ${line}`);
    await env2.KV.put(LOG_KV_KEY, prev.join("\n"), { expirationTtl: 86400 * 30 });
  } catch {
  }
}
__name(appendLog, "appendLog");

// src/handlers/callbacks.ts
async function handleCallback(ctx) {
  const data = ctx.query?.data ?? "";
  if (!data)
    return;
  const head = data.split(":")[0];
  switch (head) {
    case "menu":
      if (data === "menu:main")
        await renderMainMenu(ctx);
      break;
    case "ck":
      if (data === "ck:do")
        await doCheckin(ctx);
      break;
    case "pt":
      if (data === "pt:me")
        await cmdMe(ctx);
      else if (data === "pt:top")
        await cmdTop(ctx);
      break;
    case "in":
      if (data === "in:me")
        await cmdInvite(ctx);
      break;
    case "hp":
      if (data === "hp:show")
        await cmdHelp(ctx);
      break;
    case "tl":
      await handleToolsCallback(ctx, data);
      break;
    case "tu": {
      const parts = data.split(":");
      const op = parts[1];
      if (op === "show")
        await tutorialsHome(ctx);
      else if (op === "cat")
        await tutorialsInCategory(ctx, parts.slice(2).join(":"));
      else if (op === "it")
        await tutorialContent(ctx, Number(parts[2]));
      break;
    }
    case "ai":
      if (data === "ai:show")
        await aiHelp(ctx);
      break;
    case "ad": {
      if (!ctx.isOwner && !ctx.isAdmin) {
        await ctx.answer("\u274C \u65E0\u7BA1\u7406\u5458\u6743\u9650", true);
        return;
      }
      const op = data.split(":")[1];
      if (op === "panel")
        await adminPanel(ctx);
      else if (op === "stats")
        await cmdStats(ctx);
      else if (op === "reload")
        await cmdReload(ctx);
      break;
    }
    default:
      await ctx.answer("\u26A0\uFE0F \u672A\u77E5\u64CD\u4F5C", true);
  }
}
__name(handleCallback, "handleCallback");
async function tutorialsInCategory(ctx, raw) {
  await tutorialsByCategory(ctx, raw);
}
__name(tutorialsInCategory, "tutorialsInCategory");
async function renderMainMenu(ctx) {
  const cfg = await getConfig(ctx.env);
  const user = ctx.from ? await getUser(ctx.env.DB, ctx.from.id) : null;
  const rank = ctx.from ? await getUserRank(ctx.env.DB, ctx.from.id) : 0;
  await ctx.reply(mainMenuText(user, cfg, rank), { inlineKeyboard: mainKeyboard(ctx.isAdmin, !!user) });
}
__name(renderMainMenu, "renderMainMenu");

// src/handlers/welcome.ts
async function handleChatMemberEvent(ctx) {
  const upd = ctx.update;
  const memUpd = upd.chat_member ?? upd.my_chat_member;
  if (!memUpd || !ctx.chat)
    return;
  const { chat, new_chat_member: ncm, old_chat_member: ocm } = memUpd;
  const target = ncm?.user;
  if (!target || !chat)
    return;
  const joined = ncm.status === "member" && ocm.status !== "member";
  const left = ["left", "kicked"].includes(ncm.status) && !["left", "kicked"].includes(ocm.status);
  if (!joined)
    return;
  const cfg = await getConfig(ctx.env);
  if (!cfg.welcome.enabled)
    return;
  if (target.is_bot) {
    if (String(target.id) === String(ctx.env.TELEGRAM_BOT_TOKEN.split(":")[0])) {
      await ctx.bot.sendMessage(chat.id, "\u{1F44B} \u5927\u5BB6\u597D\uFF0C\u6211\u662F\u6570\u7801\u89E3\u7801\u5DE5\u5177\u7AD9\uFF01\n\u8F93\u5165 /help \u67E5\u770B\u6211\u7684\u80FD\u529B\u3002");
    }
    return;
  }
  const allowed = await rateLimit(ctx.env, "welcome", `chat:${chat.id}`, 2, 10);
  if (!allowed)
    return;
  const template = cfg.welcome.text;
  const text = template.replace("{name}", displayName(target)).replace("{chat}", chat.title ? escapeHtml(chat.title) : "\u672C\u7FA4").replace("{id}", String(target.id));
  await ctx.bot.sendMessage(chat.id, text, {
    parse_mode: "HTML",
    disable_web_page_preview: true
  });
}
__name(handleChatMemberEvent, "handleChatMemberEvent");
async function handleNewMembers(ctx) {
  const msg = ctx.message;
  const members = msg?.new_chat_members;
  if (!members || members.length === 0 || !ctx.chat)
    return;
  const cfg = await getConfig(ctx.env);
  if (cfg.welcome.deleteSystemMessages) {
    await ctx.bot.deleteMessage(ctx.chat.id, msg.message_id);
  }
  if (!cfg.welcome.enabled || ctx.chat.type === "private")
    return;
  if (msg.from?.is_bot)
    return;
  const allowed = await rateLimit(ctx.env, "welcome", `chat:${ctx.chat.id}`, 2, 10);
  if (!allowed)
    return;
  for (const m of members) {
    if (m.is_bot)
      continue;
    const template = cfg.welcome.text;
    const text = template.replace("{name}", `${mention(m)}`).replace("{chat}", ctx.chat.title ? escapeHtml(ctx.chat.title) : "\u672C\u7FA4").replace("{id}", String(m.id));
    await ctx.bot.sendMessage(ctx.chat.id, text, {
      parse_mode: "HTML",
      disable_web_page_preview: true
    });
    break;
  }
}
__name(handleNewMembers, "handleNewMembers");
function escapeHtml(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
__name(escapeHtml, "escapeHtml");

// src/handlers/adminCommands.ts
function requireAdmin(h) {
  return async (ctx) => {
    if (!ctx.isOwner && !ctx.isAdmin) {
      await ctx.reply("\u274C \u65E0\u7BA1\u7406\u5458\u6743\u9650");
      return;
    }
    await h(ctx);
  };
}
__name(requireAdmin, "requireAdmin");
var ADMIN_COMMANDS = {
  admin: requireAdmin(adminPanel),
  stats: requireAdmin(cmdStats),
  ban: requireAdmin(cmdBan),
  unban: requireAdmin(cmdUnban),
  give: requireAdmin(cmdGive),
  gencode: requireAdmin(cmdGenCode),
  cfg: requireAdmin(cmdCfg),
  setjson: requireAdmin(cmdSetJson),
  reload: requireAdmin(cmdReload),
  log: requireAdmin(cmdLog),
  broadcast: requireAdmin(cmdBroadcast),
  notify: requireAdmin(cmdNotify)
};
var ALL_COMMANDS = {
  ...COMMANDS,
  ...ADMIN_COMMANDS
};

// src/dispatch.ts
async function handleUpdate(env2, update) {
  const dupeKey = `ud:${update.update_id}`;
  try {
    if (await env2.KV.get(dupeKey) !== null)
      return;
    await env2.KV.put(dupeKey, "1", { expirationTtl: 300 });
  } catch {
  }
  const ctx = makeCtx(env2, update);
  if (update.message?.from?.is_bot)
    return;
  if (ctx.from) {
    try {
      await ensureUser(env2.DB, ctx.from, ctx.chat?.id);
    } catch {
    }
  }
  const banned = await checkBanStatus(env2, ctx.from ?? void 0, ctx.chat ?? void 0);
  if (banned) {
    if (update.callback_query) {
      await ctx.answer();
      return;
    }
    if (ctx.isPrivate)
      await ctx.reply("\u{1F6AB} " + banned);
    return;
  }
  if (update.callback_query) {
    if (!ctx.from)
      return;
    const ok = await rateLimit(env2, "cb", `u:${ctx.from.id}`, 60, 60);
    if (!ok) {
      await ctx.answer("\u23F3 \u64CD\u4F5C\u592A\u9891\u7E41\uFF0C\u8BF7\u7A0D\u540E\u518D\u8BD5", true);
      return;
    }
    await handleCallback(ctx);
    return;
  }
  if (update.chat_member || update.my_chat_member) {
    await handleChatMemberEvent(ctx);
    return;
  }
  if (update.message) {
    await handleMessage(ctx);
  }
}
__name(handleUpdate, "handleUpdate");
async function handleMessage(ctx) {
  const msg = ctx.message;
  if (!msg)
    return;
  if (msg.new_chat_members && msg.new_chat_members.length > 0) {
    await handleNewMembers(ctx);
    if (!msg.text && !msg.caption)
      return;
  }
  const text = (msg.text ?? msg.caption ?? "").trim();
  if (text.startsWith("/")) {
    const first = text.split(/\s+/)[0];
    const name = first.split("@")[0].slice(1).toLowerCase();
    const cmd = ALL_COMMANDS[name];
    if (cmd) {
      await cmd(ctx);
      return;
    }
    await ctx.reply(`\u672A\u77E5\u547D\u4EE4 <code>/${name}</code>\uFF0C\u53D1\u9001 /help \u67E5\u770B\u53EF\u7528\u547D\u4EE4\u3002`);
    return;
  }
  if (ctx.isPrivate) {
    if (ctx.from) {
      const pending = await getPending(ctx.env, ctx.from.id);
      if (pending && text) {
        await handleToolInput(ctx, text);
        return;
      }
    }
    if (!text)
      return;
    const cfg = await getConfig(ctx.env);
    if (text.length > cfg.limits.maxTextLen) {
      await ctx.reply("\u6D88\u606F\u592A\u957F\u5566\uFF0C\u8BF7\u7CBE\u7B80\u540E\u91CD\u8BD5\uFF08\u6700\u591A " + cfg.limits.maxTextLen + " \u5B57\u7B26\uFF09\u3002");
      return;
    }
    const faq = matchFaq(cfg, text);
    if (faq) {
      await ctx.reply(faq);
      return;
    }
    if (cfg.ai.enabled) {
      await cmdAI(ctx);
      return;
    }
    await ctx.reply("\u53D1\u9001 /help \u770B\u770B\u6211\u80FD\u505A\u4EC0\u4E48 \u{1F60A}", {
      inlineKeyboard: [[btn("\u{1F4D6} \u6253\u5F00\u5E2E\u52A9", "hp:show")]]
    });
  } else if (ctx.isGroup) {
    const cfg = await getConfig(ctx.env);
    if (!text || text.length > cfg.limits.maxTextLen)
      return;
    const faq = matchFaq(cfg, text);
    if (faq)
      await ctx.reply(faq, { replyTo: true });
  }
}
__name(handleMessage, "handleMessage");

// src/queue.ts
var sleep = /* @__PURE__ */ __name((ms) => new Promise((r) => setTimeout(r, ms)), "sleep");
async function handleQueueBatch(batch, env2) {
  for (const jobMsg of batch.messages) {
    try {
      await processJob(jobMsg.body, env2);
    } catch (e) {
      console.error("queue job failed:", JSON.stringify(jobMsg.body), e);
    }
  }
}
__name(handleQueueBatch, "handleQueueBatch");
async function processJob(job, env2) {
  const bot = new TgBot(env2.TELEGRAM_BOT_TOKEN);
  const parseMode = job.parseMode;
  switch (job.type) {
    case "notify": {
      await bot.sendMessage(job.chatId, job.text, {
        parse_mode: parseMode ?? "HTML",
        disable_web_page_preview: true
      });
      break;
    }
    case "broadcast": {
      const total = job.ids.length;
      let okCount = 0;
      for (let i = 0; i < total; i++) {
        try {
          await bot.sendMessage(job.ids[i], job.text, {
            parse_mode: parseMode ?? "HTML",
            disable_web_page_preview: true
          });
          okCount++;
        } catch {
        }
        if (i % 20 === 19)
          await sleep(200);
      }
      await env2.KV.put(`bcast:${job.id}`, `${okCount}/${total}`, { expirationTtl: 86400 });
      break;
    }
    default:
      console.warn("unknown queue job type", job);
  }
}
__name(processJob, "processJob");

// src/index.ts
var src_default = {
  async fetch(request, env2) {
    const url = new URL(request.url);
    if (url.pathname === "/" && request.method === "GET") {
      return Response.json({ ok: true, service: "digi-decoder-bot", time: (/* @__PURE__ */ new Date()).toISOString() });
    }
    if (url.pathname === "/health" && request.method === "GET") {
      return Response.json({ ok: true });
    }
    if (url.pathname === "/webhook/bot" && request.method === "POST") {
      const secret = request.headers.get("X-Telegram-Bot-Api-Secret-Token");
      if (env2.TELEGRAM_WEBHOOK_SECRET && secret !== env2.TELEGRAM_WEBHOOK_SECRET) {
        return new Response("unauthorized", { status: 401 });
      }
      const update = await request.json();
      await handleUpdate(env2, update);
      return new Response("ok");
    }
    return new Response("not found", { status: 404 });
  },
  async queue(batch, env2) {
    await handleQueueBatch(batch, env2);
  },
  async scheduled(_event, env2) {
    try {
      const res = await env2.DB.prepare("SELECT * FROM users ORDER BY id").all();
      const date = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
      await env2.R2_BUCKET.put(
        `backups/users-${date}.json`,
        JSON.stringify(res.results ?? [], null, 2)
      );
      await appendLog(env2, `\u{1F5C4}\uFE0F \u5B9A\u65F6\u5907\u4EFD\u5B8C\u6210\uFF08${date}\uFF0C${(res.results ?? []).length} \u6761\uFF09`);
    } catch (e) {
      console.error("scheduled backup failed", e);
    }
  }
};
export {
  src_default as default
};
//# sourceMappingURL=index.js.map
