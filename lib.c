#include <stdint.h>

char *itoa(int value, char *str, int base) {
    static const char *alphabet = "0123456789abcdefghijklmnopqrstuvwxyz";

    if (base < 2 || base > 36) return (char *) 0;

    if (value == 0) {
        str[0] = '0';
        str[1] = 0;
        return str;
    }

    uint32_t index = 0;
    while (value) {
        str[index] = alphabet[value % base];
        value /= base;
        index++;
    }

    for (uint32_t i = 0; i < index / 2; i++) {
        char t = str[i];
        str[i] = str[index - i - 1];
        str[index - i - 1] = t;
    }
    str[index] = 0;

    return str;
}

uint32_t cstrlen(const char *s) {
    uint32_t len;
    while (*s) {
        s++;
        len++;
    }
    return len;
}

extern uint8_t __heap_base;
uint8_t *bump_pointer = &__heap_base;

 void *allocate(int32_t size) {
    uint8_t *ptr = bump_pointer;
    bump_pointer += size;
    return (void *) ptr;
}

typedef void (callback_func_t)(int32_t event, void *arg);

void log_puts(const char *s);
int32_t element_get(const char *query);
int32_t element_create(const char *element);
void element_set_id(int32_t element, const char *id);
void element_append_child(int32_t element, int32_t child);
void element_remove_child(int32_t element, int32_t child);
void element_set_inner_text(int32_t element, const char *text);
void element_set_type(int32_t element, const char *text);
void element_set_callback(int32_t element, const char *event, callback_func_t *callback, void *arg);
const char *element_get_value(int32_t element);
void element_set_value(int32_t element, const char *value);
void event_prevent_default(int32_t event);

int32_t list;
int32_t add_input;

void remove_onclick(int32_t event, void *arg) {
    int32_t item = (int32_t) (uintptr_t) arg;
    element_remove_child(list, item);
}

void add_onclick(int32_t event, void *arg) {
    event_prevent_default(event);

    const char *text = element_get_value(add_input);
    if (cstrlen(text) == 0) return;

    int32_t item = element_create("li");
    element_append_child(list, item);

    int32_t remove_button = element_create("button");
    element_set_inner_text(remove_button, "×");
    element_set_callback(remove_button, "click", remove_onclick, (void *) (uintptr_t) item);
    element_append_child(item, remove_button);

    int32_t span = element_create("span");
    element_set_inner_text(span, text);
    element_append_child(item, span);

    element_set_value(add_input, "");
}

void start(void) {
    int32_t app = element_get("div.app");

    int32_t h1 = element_create("h1");
    element_set_inner_text(h1, "C TODO");
    element_append_child(app, h1);

    int32_t add_form = element_create("form");
    element_append_child(app, add_form);

    int32_t add_button = element_create("button");
    element_set_inner_text(add_button, "New");
    element_append_child(add_form, add_button);

    add_input = element_create("input");
    element_set_type(add_input, "text");
    element_append_child(add_form, add_input);

    list = element_create("ul");
    element_append_child(app, list);

    element_set_callback(add_form, "submit", add_onclick, (void *) (uintptr_t) list);
}
