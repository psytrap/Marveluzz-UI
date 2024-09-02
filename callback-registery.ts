
// TODO proper clean-up of scopes
// TODO -> manage Callbacks (clear/remove scope + recursive) and integrate addCallback here
// TODO scope in scope removal

export class CallbackRegistry  {
    private nextId: number = 0;
    private callbacks: Map<number, () => void> = new Map();
    private idsByScope: Map<string, Set<number>> = new Map();
  
  
    register(scope: string, callback: () => void): number {
      const id = this.nextId++;
      this.callbacks.set(id, callback);
      return id;
    }
  
    unregister(scope: string) {
      const ids = this.idsByScope.get(scope);
      if (ids) {
        for (const id of ids) {
          this.callbacks.delete(id);
        }
        this.idsByScope.delete(scope);
      }
    }
  
    trigger(id: number) {
      const callback = this.callbacks.get(id);
      if (callback) {
        callback(); // Only call if callback is defined
      } else {
        console.error(`Callback not found for id: ${id}`);
      }
    }
  
}