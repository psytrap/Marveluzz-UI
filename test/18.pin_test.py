import subprocess
import time

from percy import percy_snapshot
from selenium.webdriver import Chrome
from selenium.webdriver.common.by import By
from selenium.webdriver.common.action_chains import ActionChains
from selenium.webdriver.support.ui import Select

import pywebio
import util
from pywebio import start_server
from pywebio.output import *
from pywebio.pin import *
from pywebio.utils import run_as_function, to_coroutine

PASSED_TEXT = "All-assert-passed"


def target():
    options = ['A', 'B', 'C']
    put_input('input', label='input')
    put_textarea('textarea', label='textarea', rows=3, code=None, maxlength=10, minlength=20, value=None,
                 placeholder='placeholder', readonly=False, help_text='help_text')
    put_textarea('code', label='code', rows=4, code=True, maxlength=10, minlength=20, value=None,
                 placeholder='placeholder', readonly=False, help_text='help_text')
    put_select('select', options=options, label='Input pin widget')
    put_select('select_multiple', options=options, label='select-multiple', multiple=True, value=None,
               help_text='help_text')
    put_checkbox('checkbox', options=options, label='checkbox', inline=False, value=None, help_text='help_text')
    put_checkbox('checkbox_inline', options=options, label='checkbox_inline', inline=True, value=None,
                 help_text='help_text')
    put_radio('radio', options=options, label='radio', inline=False, value=None, help_text='help_text')
    put_radio('radio_inline', options=options, label='radio_inline', inline=True, value='B', help_text='help_text')
    put_actions('actions', buttons=['action_a', 'action_b'], label='actions')

    pin_update('input', help_text='This is help text')
    pin_update('select_multiple', value=['B', 'C'])

    pin.radio = 'B'
    assert (yield pin['radio']) == (yield pin.radio) == 'B'

    names = ['input', 'textarea', 'code', 'select', 'select_multiple', 'checkbox', 'checkbox_inline', 'radio',
             'radio_inline', 'actions']
    values = {}
    on_change_values = {}

    for name in names:
        pin_on_change(name, lambda val, name=name: on_change_values.__setitem__(name, val))

    while len(names) != len(values):
        info = yield pin_wait_change(*names)
        values[info['name']] = info['value']

    for name in names:
        assert (yield pin[name]) == values.get(name) == on_change_values.get(name)
        put_text(name, values.get(name), on_change_values.get(name))

    put_text(PASSED_TEXT)


def thread_target():
    run_as_function(target())


async def coro_target():
    await to_coroutine(target())


def test_one_page(browser: Chrome):
    browser.find_element(By.CSS_SELECTOR, '[name=input]').send_keys("1")
    time.sleep(0.5)
    browser.find_element(By.CSS_SELECTOR, '[name=textarea]').send_keys("2")
    time.sleep(0.5)
    Select(browser.find_element(By.CSS_SELECTOR, '[name=select]')).select_by_visible_text('B')
    time.sleep(0.5)
    Select(browser.find_element(By.CSS_SELECTOR, '[name=select_multiple]')).select_by_visible_text('A')
    time.sleep(0.5)
    browser.find_element(By.CSS_SELECTOR, '[name=checkbox]').click()
    time.sleep(0.5)
    browser.find_element(By.CSS_SELECTOR, '[name=checkbox_inline]').click()
    time.sleep(0.5)
    browser.find_element(By.CSS_SELECTOR, '[name=radio]').click()
    time.sleep(0.5)
    browser.find_element(By.CSS_SELECTOR, '[name=radio_inline]').click()
    time.sleep(0.5)
    browser.find_element(By.CSS_SELECTOR, 'button[type=\"submit\"]').click()
    time.sleep(0.5)
    codeMirror = browser.find_element(By.CSS_SELECTOR, ".CodeMirror pre")
    action_chains = ActionChains(browser)
    action_chains.move_to_element(codeMirror).click(codeMirror).send_keys('3').perform()


def test(server_proc: subprocess.Popen, browser: Chrome):
    browser.get('http://localhost:8080/?app=thread_target')
    time.sleep(2)
    test_one_page(browser)
    time.sleep(2)
    percy_snapshot(browser, name='pin')
    assert PASSED_TEXT in browser.find_element(By.ID, 'markdown-body').get_attribute('innerHTML')

    browser.get('http://localhost:8080/?app=coro_target')
    time.sleep(2)
    test_one_page(browser)
    time.sleep(1)
    assert PASSED_TEXT in browser.find_element(By.ID, 'markdown-body').get_attribute('innerHTML')


def start_test_server():
    pywebio.enable_debug()
    start_server([thread_target, coro_target], port=8080, host='127.0.0.1', auto_open_webbrowser=False, cdn=False)


if __name__ == '__main__':
    util.run_test(start_test_server, test)
