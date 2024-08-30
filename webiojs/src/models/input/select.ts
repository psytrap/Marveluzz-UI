import {InputItem} from "./base";
import {deep_copy, is_mobile, make_set} from "../../utils"

const options_tpl = `
{{#options}}
<option {{#selected}}selected{{/selected}} {{#disabled}}disabled{{/disabled}}>{{label}}</option>
{{/options}}
`;
const select_input_tpl = `
<div class="form-group">
    {{#label}}<label for="{{id_name}}">{{label}}</label>{{/label}}
    <select id="{{id_name}}" aria-describedby="{{id_name}}_help" class="form-control" {{#multiple}}multiple{{/multiple}}>
        ${options_tpl}
    </select>
    <div class="invalid-feedback">{{invalid_feedback}}</div>
    <div class="valid-feedback">{{valid_feedback}}</div>
    <small id="{{id_name}}_help" class="form-text text-muted">{{help_text}}</small>
</div>`;

// @ts-ignore
$.fn.selectpicker.Constructor.BootstrapVersion = '4';

export class Select extends InputItem {
    static accept_input_types: string[] = ["select"];

    use_bootstrap_select: boolean = false;

    constructor(spec: any, task_id: string, on_input_event: (event_name: string, input_item: InputItem) => void) {
        super(spec, task_id, on_input_event);
        if (spec.native === false || (spec.native === undefined && spec.multiple && !is_mobile())) {
            this.use_bootstrap_select = true;
        }
    }

    create_element(): JQuery {
        let spec = deep_copy(this.spec);
        const id_name = spec.name + '-' + Math.floor(Math.random() * Math.floor(9999));
        spec['id_name'] = id_name;

        let html = Mustache.render(select_input_tpl, spec);
        this.element = $(html);
        this.setup_select_options(this.element, spec.options);

        if (this.use_bootstrap_select) {
            // @ts-ignore
            this.element.find('select').selectpicker();
        }

        if (spec.onblur) {
            // blur事件时，发送当前值到服务器
            this.element.find('select').on("blur", (e) => {
                this.on_input_event("blur", this);
            });
        }
        if (spec.onchange) {
            this.element.find('select').on("change", (e) => {
                this.on_input_event("change", this);
            });
        }
        return this.element;
    }

    setup_select_options(elem: JQuery, options: any) {
        let input_elem = elem.find('select');
        let opts = input_elem.find('option');
        for (let idx = 0; idx < options.length; idx++)
            opts.eq(idx).val(JSON.stringify(options[idx].value));

        // 将额外的html参数加到input标签上
        const ignore_keys = make_set(['type', 'label', 'invalid_feedback', 'valid_feedback', 'help_text',
            'options', 'datalist', 'multiple', 'onchange', 'onblur'])

        for (let key in this.spec) {
            if (key in ignore_keys) continue;
            input_elem.attr(key, this.spec[key]);
        }

        if (this.use_bootstrap_select) {
            // @ts-ignore
            input_elem.selectpicker('refresh');
        }
    }

    update_input(spec: any): any {
        let attributes = spec.attributes;

        if ('options' in attributes) {
            const opts_html = Mustache.render(options_tpl, {options: attributes.options});
            this.element.find('select').empty().append(opts_html);
            this.setup_select_options(this.element, attributes.options);
            delete attributes['options'];
        }

        if ('value' in attributes) {
            this.element.find('option').prop('selected', false);
            let values: any[] = attributes.value;
            if (!this.spec.multiple) {
                values = [attributes.value];
            }
            this.element.find('option').each(function (index) {
                let item_val = JSON.parse($(this).val() as string);
                if (values.indexOf(item_val) != -1) {
                    $(this).prop('selected', true);
                }
            });
            if (this.use_bootstrap_select) {
                // @ts-ignore
                this.element.find('select').selectpicker('render');
            }
            delete attributes['value'];
        }

        this.update_input_helper(-1, attributes);
    }

    on_reset(e: any) {
        // need to wait some time to get the select element be reset, and then update `selectpicker`
        if (this.use_bootstrap_select)
            setTimeout(() => {
                // @ts-ignore
                this.element.find('select').selectpicker('render');
            }, 100)
    }

    get_value(): any {
        let raw_val = this.element.find('select').val();
        if (this.spec.multiple) {
            let res: any[] = [];
            for (let i of (raw_val as string[]))
                res.push(JSON.parse(i));
            return res;
        } else {
            return JSON.parse(raw_val as string);
        }
    }
}

