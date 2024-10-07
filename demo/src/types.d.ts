declare module '*?url' {
  const url: string
  export default url
}

declare module '*?worker' {
  interface WorkerConstructor {
    new (): Worker
  }

  const Worker: WorkerConstructor
  export default Worker
}

declare module '*?raw' {
  const content: string
  export default content
}
